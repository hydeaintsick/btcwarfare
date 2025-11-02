const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BTCWarfare", function () {
  let btcWarfare;
  let mockPriceFeed;
  let owner;
  let player1;
  let player2;
  let player3;
  let player4;

  const MVP_ROOM_STAKE = ethers.parseEther("0.0015");
  const BATTLE_DURATION = 60;

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // Déployer MockPriceFeed
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    // Prix initial BTC/USD = $50000 (en 8 décimales = 50000 * 10^8)
    const initialPrice = ethers.parseUnits("50000", 8);
    mockPriceFeed = await MockPriceFeed.deploy(initialPrice, 8);
    await mockPriceFeed.waitForDeployment();

    // Déployer BTCWarfare
    const BTCWarfare = await ethers.getContractFactory("BTCWarfare");
    btcWarfare = await BTCWarfare.deploy(await mockPriceFeed.getAddress());
    await btcWarfare.waitForDeployment();
  });

  describe("Déploiement", function () {
    it("Devrait déployer le contrat avec les bonnes valeurs", async function () {
      expect(await btcWarfare.BATTLE_DURATION()).to.equal(BATTLE_DURATION);
      expect(await btcWarfare.MVP_ROOM_STAKE()).to.equal(MVP_ROOM_STAKE);
      expect(await btcWarfare.COMMISSION_RATE()).to.equal(5);
    });
  });

  describe("enterRoom", function () {
    it("Devrait permettre à un joueur d'entrer dans la queue Long", async function () {
      await expect(
        btcWarfare.connect(player1).enterRoom(true, { value: MVP_ROOM_STAKE })
      ).to.emit(btcWarfare, "PlayerEnteredQueue");

      expect(await btcWarfare.isInQueue(player1.address, true)).to.be.true;
    });

    it("Devrait permettre à un joueur d'entrer dans la queue Short", async function () {
      await expect(
        btcWarfare.connect(player1).enterRoom(false, { value: MVP_ROOM_STAKE })
      ).to.emit(btcWarfare, "PlayerEnteredQueue");

      expect(await btcWarfare.isInQueue(player1.address, false)).to.be.true;
    });

    it("Devrait rejeter si le montant de mise est incorrect", async function () {
      await expect(
        btcWarfare.connect(player1).enterRoom(true, { value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Invalid stake amount");
    });

    it("Devrait matcher automatiquement Long et Short et créer une battle", async function () {
      // Player1 entre en Long
      await btcWarfare.connect(player1).enterRoom(true, { value: MVP_ROOM_STAKE });

      // Player2 entre en Short - devrait déclencher le matching
      await expect(
        btcWarfare.connect(player2).enterRoom(false, { value: MVP_ROOM_STAKE })
      ).to.emit(btcWarfare, "BattleStarted");

      // Vérifier que les joueurs ne sont plus dans les queues
      expect(await btcWarfare.isInQueue(player1.address, true)).to.be.false;
      expect(await btcWarfare.isInQueue(player2.address, false)).to.be.false;

      // Vérifier que la battle existe
      const battle = await btcWarfare.getBattle(1);
      expect(battle.longPlayer).to.equal(player1.address);
      expect(battle.shortPlayer).to.equal(player2.address);
      expect(battle.resolved).to.be.false;
      expect(battle.winner).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Matching FIFO", function () {
    it("Devrait matcher les joueurs dans l'ordre FIFO", async function () {
      // Player1 entre en Long
      await btcWarfare.connect(player1).enterRoom(true, { value: MVP_ROOM_STAKE });

      // Player2 entre en Long
      await btcWarfare.connect(player2).enterRoom(true, { value: MVP_ROOM_STAKE });

      // Player3 entre en Short - devrait matcher avec Player1 (FIFO)
      await btcWarfare.connect(player3).enterRoom(false, { value: MVP_ROOM_STAKE });

      const battle1 = await btcWarfare.getBattle(1);
      expect(battle1.longPlayer).to.equal(player1.address);
      expect(battle1.shortPlayer).to.equal(player3.address);

      // Player4 entre en Short - devrait matcher avec Player2
      await btcWarfare.connect(player4).enterRoom(false, { value: MVP_ROOM_STAKE });

      const battle2 = await btcWarfare.getBattle(2);
      expect(battle2.longPlayer).to.equal(player2.address);
      expect(battle2.shortPlayer).to.equal(player4.address);
    });
  });

  describe("resolveBattle", function () {
    beforeEach(async function () {
      // Créer une battle
      await btcWarfare.connect(player1).enterRoom(true, { value: MVP_ROOM_STAKE });
      await btcWarfare.connect(player2).enterRoom(false, { value: MVP_ROOM_STAKE });
    });

    it("Devrait rejeter si la battle n'est pas terminée", async function () {
      await expect(btcWarfare.resolveBattle(1)).to.be.revertedWith("Battle not ended");
    });

    it("Devrait résoudre la battle après 60 secondes - Long gagne si prix monte", async function () {
      // Avancer le temps de 60 secondes
      await ethers.provider.send("evm_increaseTime", [BATTLE_DURATION]);
      await ethers.provider.send("evm_mine", []);

      // Augmenter le prix (Long gagne)
      const newPrice = ethers.parseUnits("51000", 8); // Prix monté à $51000
      await mockPriceFeed.setPrice(newPrice);

      // Résoudre la battle
      const initialBalance = await ethers.provider.getBalance(player1.address);

      await expect(btcWarfare.resolveBattle(1))
        .to.emit(btcWarfare, "BattleResolved");

      const battle = await btcWarfare.getBattle(1);
      expect(battle.resolved).to.be.true;
      expect(battle.winner).to.equal(player1.address);
    });

    it("Devrait résoudre la battle - Short gagne si prix descend", async function () {
      // Avancer le temps de 60 secondes
      await ethers.provider.send("evm_increaseTime", [BATTLE_DURATION]);
      await ethers.provider.send("evm_mine", []);

      // Diminuer le prix (Short gagne)
      const newPrice = ethers.parseUnits("49000", 8); // Prix descendu à $49000
      await mockPriceFeed.setPrice(newPrice);

      // Résoudre la battle
      await expect(btcWarfare.resolveBattle(1))
        .to.emit(btcWarfare, "BattleResolved");

      const battle = await btcWarfare.getBattle(1);
      expect(battle.resolved).to.be.true;
      expect(battle.winner).to.equal(player2.address);
    });

    it("Devrait distribuer correctement les gains (95% au gagnant, 5% commission)", async function () {
      // Avancer le temps
      await ethers.provider.send("evm_increaseTime", [BATTLE_DURATION]);
      await ethers.provider.send("evm_mine", []);

      // Long gagne
      const newPrice = ethers.parseUnits("51000", 8);
      await mockPriceFeed.setPrice(newPrice);

      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const initialPlayer1Balance = await ethers.provider.getBalance(player1.address);

      const tx = await btcWarfare.resolveBattle(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      const finalPlayer1Balance = await ethers.provider.getBalance(player1.address);

      const totalStake = MVP_ROOM_STAKE * 2n;
      const commission = (totalStake * 5n) / 100n;
      const winnerAmount = totalStake - commission;

      // Vérifier la commission (owner)
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(commission);

      // Vérifier les gains du gagnant (en tenant compte du gas)
      expect(finalPlayer1Balance - (initialPlayer1Balance - gasUsed)).to.equal(winnerAmount);
    });

    it("Devrait rejeter si on essaie de résoudre deux fois", async function () {
      await ethers.provider.send("evm_increaseTime", [BATTLE_DURATION]);
      await ethers.provider.send("evm_mine", []);

      await btcWarfare.resolveBattle(1);

      await expect(btcWarfare.resolveBattle(1)).to.be.revertedWith("Battle already resolved");
    });
  });

  describe("leaveQueue", function () {
    it("Devrait permettre de quitter la queue et rembourser", async function () {
      await btcWarfare.connect(player1).enterRoom(true, { value: MVP_ROOM_STAKE });

      const initialBalance = await ethers.provider.getBalance(player1.address);

      const tx = await btcWarfare.connect(player1).leaveQueue(true);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(player1.address);

      // Vérifier le remboursement (en tenant compte du gas)
      expect(finalBalance - (initialBalance - gasUsed)).to.equal(MVP_ROOM_STAKE);
      expect(await btcWarfare.isInQueue(player1.address, true)).to.be.false;
    });
  });

  describe("getCurrentBTCPrice", function () {
    it("Devrait retourner le prix actuel de BTC/USD", async function () {
      const price = await btcWarfare.getCurrentBTCPrice();
      expect(price).to.equal(ethers.parseUnits("50000", 8));
    });
  });

});


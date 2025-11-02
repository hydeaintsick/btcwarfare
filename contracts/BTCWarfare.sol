// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceFeed.sol";

/**
 * @title BTCWarfare
 * @dev Contrat principal pour les battles P2P Bitcoin (Long vs Short)
 * @notice MVP: Room unique avec mise de 0.0015 ETH, cycle de 60 secondes
 */
contract BTCWarfare is ReentrancyGuard, Ownable {
    // Constants
    uint8 public constant COMMISSION_RATE = 5; // 5%
    uint256 public constant BATTLE_DURATION = 60; // 60 secondes
    uint256 public constant MVP_ROOM_STAKE = 0.0015 ether; // MVP: 0.0015 ETH

    // Chainlink Price Feed
    IPriceFeed public priceFeed;

    // Room structure pour MVP (une seule room)
    struct Room {
        uint256 stakeAmount;
        uint256 longQueue; // Compteur pour tracking FIFO Long
        uint256 shortQueue; // Compteur pour tracking FIFO Short
        mapping(address => uint256) longWaitingPlayers; // address => queueIndex
        mapping(address => uint256) shortWaitingPlayers; // address => queueIndex
        mapping(uint256 => address) longQueueByIndex; // queueIndex => address
        mapping(uint256 => address) shortQueueByIndex; // queueIndex => address
    }

    // Battle structure
    struct Battle {
        address longPlayer;
        address shortPlayer;
        uint256 startPrice; // Prix BTC/USD au début de la battle (en USD * 10^8)
        uint256 startTime; // Timestamp de début de la battle
        uint256 stakeAmount; // Montant de la mise par joueur
        bool resolved; // Si la battle est résolue
        address winner; // Adresse du gagnant (0 si pas encore déterminé)
    }

    // Storage
    Room public mvpRoom;
    mapping(uint256 => Battle) public battles; // battleId => Battle
    uint256 public battleCounter;
    mapping(address => uint256[]) public playerBattles; // player => battleIds[]

    // Events
    event PlayerEnteredQueue(address indexed player, bool isLong, uint256 queueIndex);
    event BattleStarted(
        uint256 indexed battleId,
        address indexed longPlayer,
        address indexed shortPlayer,
        uint256 startPrice,
        uint256 startTime
    );
    event BattleResolved(
        uint256 indexed battleId,
        address indexed winner,
        uint256 longStake,
        uint256 shortStake,
        uint256 commission
    );
    event Withdrawal(address indexed player, uint256 amount);

    // Errors
    error InvalidStakeAmount();
    error AlreadyInQueue();
    error NoOpponentFound();
    error BattleNotResolved();
    error BattleAlreadyResolved();
    error BattleNotEnded();
    error InvalidPlayer();

    /**
     * @dev Constructor
     * @param _priceFeed Adresse du Chainlink Price Feed pour BTC/USD
     */
    constructor(address _priceFeed) Ownable(msg.sender) {
        require(_priceFeed != address(0), "Invalid price feed address");
        priceFeed = IPriceFeed(_priceFeed);
        mvpRoom.stakeAmount = MVP_ROOM_STAKE;
    }

    /**
     * @dev Entrer dans la file d'attente pour une battle
     * @param isLong true pour Long, false pour Short
     */
    function enterRoom(bool isLong) external payable nonReentrant {
        require(msg.value == MVP_ROOM_STAKE, "Invalid stake amount");

        Room storage room = mvpRoom;

        // Vérifier que le joueur n'est pas déjà dans une queue
        if (isLong) {
            require(
                room.longWaitingPlayers[msg.sender] == 0 ||
                    room.longQueueByIndex[room.longWaitingPlayers[msg.sender]] != msg.sender,
                "Already in queue"
            );
            room.longQueue++;
            room.longQueueByIndex[room.longQueue] = msg.sender;
            room.longWaitingPlayers[msg.sender] = room.longQueue;

            emit PlayerEnteredQueue(msg.sender, true, room.longQueue);

            // Essayer de matcher avec un joueur Short
            if (room.shortQueue > 0) {
                _matchPlayers();
            }
        } else {
            require(
                room.shortWaitingPlayers[msg.sender] == 0 ||
                    room.shortQueueByIndex[room.shortWaitingPlayers[msg.sender]] != msg.sender,
                "Already in queue"
            );
            room.shortQueue++;
            room.shortQueueByIndex[room.shortQueue] = msg.sender;
            room.shortWaitingPlayers[msg.sender] = room.shortQueue;

            emit PlayerEnteredQueue(msg.sender, false, room.shortQueue);

            // Essayer de matcher avec un joueur Long
            if (room.longQueue > 0) {
                _matchPlayers();
            }
        }
    }

    /**
     * @dev Matcher deux joueurs (Long et Short)
     * @notice Fonction interne appelée automatiquement après entrée dans queue
     */
    function _matchPlayers() internal {
        Room storage room = mvpRoom;

        // Vérifier qu'il y a au moins un joueur de chaque côté
        if (room.longQueue == 0 || room.shortQueue == 0) {
            return;
        }

        // Récupérer le premier joueur de chaque queue (FIFO)
        address longPlayer = _getNextPlayer(true);
        address shortPlayer = _getNextPlayer(false);

        if (longPlayer == address(0) || shortPlayer == address(0)) {
            return;
        }

        // Retirer les joueurs des queues
        _removeFromQueue(longPlayer, true);
        _removeFromQueue(shortPlayer, false);

        // Créer une nouvelle battle
        battleCounter++;
        uint256 battleId = battleCounter;

        // Obtenir le prix actuel de BTC/USD
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");

        uint256 startPrice = uint256(price);
        uint256 startTime = block.timestamp;

        battles[battleId] = Battle({
            longPlayer: longPlayer,
            shortPlayer: shortPlayer,
            startPrice: startPrice,
            startTime: startTime,
            stakeAmount: MVP_ROOM_STAKE,
            resolved: false,
            winner: address(0)
        });

        playerBattles[longPlayer].push(battleId);
        playerBattles[shortPlayer].push(battleId);

        emit BattleStarted(battleId, longPlayer, shortPlayer, startPrice, startTime);
    }

    /**
     * @dev Récupérer le prochain joueur de la queue
     * @param isLong true pour Long, false pour Short
     * @return L'adresse du prochain joueur (address(0) si aucun)
     */
    function _getNextPlayer(bool isLong) internal view returns (address) {
        Room storage room = mvpRoom;

        if (isLong) {
            for (uint256 i = 1; i <= room.longQueue; i++) {
                address player = room.longQueueByIndex[i];
                if (player != address(0)) {
                    return player;
                }
            }
        } else {
            for (uint256 i = 1; i <= room.shortQueue; i++) {
                address player = room.shortQueueByIndex[i];
                if (player != address(0)) {
                    return player;
                }
            }
        }
        return address(0);
    }

    /**
     * @dev Retirer un joueur de la queue
     * @param player Adresse du joueur à retirer
     * @param isLong true pour Long, false pour Short
     */
    function _removeFromQueue(address player, bool isLong) internal {
        Room storage room = mvpRoom;

        if (isLong) {
            uint256 index = room.longWaitingPlayers[player];
            if (index > 0) {
                delete room.longQueueByIndex[index];
                delete room.longWaitingPlayers[player];
            }
        } else {
            uint256 index = room.shortWaitingPlayers[player];
            if (index > 0) {
                delete room.shortQueueByIndex[index];
                delete room.shortWaitingPlayers[player];
            }
        }
    }

    /**
     * @dev Résoudre une battle après 60 secondes
     * @param battleId ID de la battle à résoudre
     */
    function resolveBattle(uint256 battleId) external nonReentrant {
        Battle storage battle = battles[battleId];
        require(battle.longPlayer != address(0), "Battle does not exist");
        require(!battle.resolved, "Battle already resolved");
        require(
            block.timestamp >= battle.startTime + BATTLE_DURATION,
            "Battle not ended"
        );

        // Obtenir le prix actuel de BTC/USD
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");

        uint256 currentPrice = uint256(price);

        // Déterminer le gagnant
        address winner;
        if (currentPrice > battle.startPrice) {
            // Prix monté : Long gagne
            winner = battle.longPlayer;
        } else if (currentPrice < battle.startPrice) {
            // Prix descendu : Short gagne
            winner = battle.shortPlayer;
        } else {
            // Prix égal : match nul, remboursement (rare mais possible)
            // Ici on pourrait choisir de rembourser ou de donner au joueur Long par défaut
            winner = battle.longPlayer; // Par défaut Long en cas d'égalité
        }

        battle.winner = winner;
        battle.resolved = true;

        // Calculer les montants
        uint256 totalStake = battle.stakeAmount * 2; // Mise totale (2 joueurs)
        uint256 commission = (totalStake * COMMISSION_RATE) / 100;
        uint256 winnerAmount = totalStake - commission;

        // Distribuer les gains
        (bool success, ) = payable(winner).call{value: winnerAmount}("");
        require(success, "Transfer failed");

        // Commission pour le owner (plateforme)
        if (commission > 0) {
            (success, ) = payable(owner()).call{value: commission}("");
            require(success, "Commission transfer failed");
        }

        emit BattleResolved(battleId, winner, battle.stakeAmount, battle.stakeAmount, commission);
    }

    /**
     * @dev Retirer un joueur de la queue manuellement
     * @param isLong true pour Long, false pour Short
     */
    function leaveQueue(bool isLong) external {
        _removeFromQueue(msg.sender, isLong);

        // Rembourser la mise
        (bool success, ) = payable(msg.sender).call{value: MVP_ROOM_STAKE}("");
        require(success, "Refund failed");
    }

    /**
     * @dev Obtenir les informations d'une battle
     * @param battleId ID de la battle
     * @return Battle structure complète
     */
    function getBattle(uint256 battleId) external view returns (Battle memory) {
        return battles[battleId];
    }

    /**
     * @dev Obtenir les battles d'un joueur
     * @param player Adresse du joueur
     * @return Array des battleIds
     */
    function getPlayerBattles(address player) external view returns (uint256[] memory) {
        return playerBattles[player];
    }

    /**
     * @dev Vérifier si un joueur est dans une queue
     * @param player Adresse du joueur
     * @param isLong true pour Long, false pour Short
     * @return true si le joueur est dans la queue
     */
    function isInQueue(address player, bool isLong) external view returns (bool) {
        Room storage room = mvpRoom;
        if (isLong) {
            uint256 index = room.longWaitingPlayers[player];
            return index > 0 && room.longQueueByIndex[index] == player;
        } else {
            uint256 index = room.shortWaitingPlayers[player];
            return index > 0 && room.shortQueueByIndex[index] == player;
        }
    }

    /**
     * @dev Obtenir le prix actuel de BTC/USD depuis Chainlink
     * @return Prix en USD * 10^8
     */
    function getCurrentBTCPrice() external view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    /**
     * @dev Mettre à jour l'adresse du Price Feed (seulement owner)
     * @param _priceFeed Nouvelle adresse du Price Feed
     */
    function updatePriceFeed(address _priceFeed) external onlyOwner {
        require(_priceFeed != address(0), "Invalid price feed address");
        priceFeed = IPriceFeed(_priceFeed);
    }
}


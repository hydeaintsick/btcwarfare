const hre = require("hardhat");

async function main() {
  console.log("Deploying BTCWarfare contract...");

  // Adresses des Chainlink Price Feeds pour différents réseaux
  // BTC/USD Price Feed addresses
  const priceFeedAddresses = {
    mumbai: "0x007A22900a3B98143368Bd5906f8E17e9867581b", // Mock Aggregator (pour testnet)
    arbitrumSepolia: "0x6ce185860a4963106506C203335A2910413708e9", // BTC/USD Sepolia
  };

  const network = hre.network.name;
  let priceFeedAddress;

  if (network === "mumbai") {
    priceFeedAddress = priceFeedAddresses.mumbai;
  } else if (network === "arbitrumSepolia") {
    priceFeedAddress = priceFeedAddresses.arbitrumSepolia;
  } else {
    // Pour Hardhat local ou autres réseaux, on utilisera une adresse mock
    console.log("⚠️  Using mock price feed for local/hardhat network");
    // Il faudrait déployer un mock price feed pour le test local
    throw new Error("Please deploy a mock price feed for local network");
  }

  const BTCWarfare = await hre.ethers.getContractFactory("BTCWarfare");
  const btcWarfare = await BTCWarfare.deploy(priceFeedAddress);

  await btcWarfare.waitForDeployment();
  const address = await btcWarfare.getAddress();

  console.log("✅ BTCWarfare deployed to:", address);
  console.log("Network:", network);
  console.log("Price Feed:", priceFeedAddress);

  // Optionnel: Vérifier le contrat sur Etherscan si API key disponible
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [priceFeedAddress],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️  Contract verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


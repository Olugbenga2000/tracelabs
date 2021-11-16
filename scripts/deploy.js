const main = async() =>{
    let timeIntervalInMins = 5;
    const bankContractFactory = await hre.ethers.getContractFactory('RinkebyBankContract');
    const bankContract = await bankContractFactory.deploy(timeIntervalInMins)
    await bankContract.deployed();
    console.log('Bank Contract deployed to : ', bankContract.address)

}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
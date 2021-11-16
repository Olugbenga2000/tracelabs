const main = async() =>{
    let timeIntervalInMins = 2;
    const tokenContractFactory = await hre.ethers.getContractFactory('MockToken');
    const bankContractFactory = await hre.ethers.getContractFactory('BankContract');

    const tokenContract = await tokenContractFactory.deploy()
    await tokenContract.deployed();
    console.log('token Contract deployed to : ', tokenContract.address)

    const bankContract = await bankContractFactory.deploy(timeIntervalInMins, tokenContract.address)
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
const { expect } = require('chai');
const { ethers } = require('hardhat');  

describe("Bank Contract", () => { 
let bankContract, tokenContract,owner, addr1, addr2, timeIntervalInMins, amount;
  beforeEach(async () => {
      timeIntervalInMins = 2;
      const tokenContractFactory = await hre.ethers.getContractFactory('MockToken');
      const bankContractFactory = await hre.ethers.getContractFactory('BankContract');

    tokenContract = await tokenContractFactory.deploy();
    bankContract = await bankContractFactory.deploy(timeIntervalInMins, tokenContract.address);

    [owner, addr1, addr2,_] = await ethers.getSigners();
  });

  describe("Deployment", () => {
    it("It should initialize the variables correctly", async () => {
      expect(await bankContract.owner()).to.equal(owner.address);
      expect(await bankContract.interval()).to.equal(timeIntervalInMins * 60);
      expect(await bankContract.depositToken()).to.equal(tokenContract.address);
    });
  });

  describe("Adding tokens", () => {
    it("should revert when the user doesnt have enough token balance", async() => {
      await expect(bankContract.deposit(ethers.utils.parseEther('1000').toString()))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    })

    it("should revert when the contract hasnt been approved to transfer token", async() => {
      await tokenContract.mint(ethers.utils.parseEther('1000').toString());
      await expect(bankContract.deposit(ethers.utils.parseEther('1000').toString()))
        .to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    })

    it("should revert when 0 token amount is sent", async() => {
      await expect(bankContract.deposit(0))
        .to.be.revertedWith("can not deposit 0 tokens");
    })

    it("contract owner can add tokens to the reward pool", async() => {
      amount = ethers.utils.parseEther('1000').toString()
      await tokenContract.mint(amount);
      await tokenContract.approve(bankContract.address, amount);
      await bankContract.deposit(amount);
      expect(await bankContract.balances(owner.address)).to.equal(0)
      expect(await bankContract.rewardPool()).to.equal(amount);
      expect(await bankContract.firstAvailablePool()).to.equal((0.2 * amount).toString());
      expect(await bankContract.secondAvailablePool()).to.equal((0.3 * amount).toString());
      expect(await bankContract.thirdAvailablePool()).to.equal((0.5 * amount).toString());
    })
    
    it("others can stake their token in the bank", async() => {
      amount = ethers.utils.parseEther('1000').toString()
      await tokenContract.connect(addr1).mint(amount);
      await tokenContract.connect(addr1).approve(bankContract.address, amount);
      await bankContract.connect(addr1).deposit(amount);
      expect(await bankContract.balances(addr1.address)).to.equal(amount);

      amount = ethers.utils.parseEther('4000').toString()
      await tokenContract.connect(addr2).mint(amount);
      await tokenContract.connect(addr2).approve(bankContract.address, amount);
      await bankContract.connect(addr2).deposit(amount);
      expect(await bankContract.balances(addr2.address)).to.equal(amount);
    })

    it("should revert if anyone tries to send token after the first time interval", async() =>{
      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 60]);
      amount = ethers.utils.parseEther('1000').toString();
      await expect(bankContract.deposit(amount)).to.be.revertedWith("User can not deposit again");
      await expect(bankContract.connect(addr1).deposit(amount)).to.be.revertedWith("User can not deposit again");
      
    })
  })
 
  describe("Witdraw tokens", async() => {
    it("token withdrawal should revert if second time interval has not been reached", async() =>{
      await expect(bankContract.withdraw()).to.be.revertedWith("you cant withdraw yet");
      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 100]);
      await expect(bankContract.connect(addr1).withdraw()).to.be.revertedWith("you cant withdraw yet");
    })

    it("token withdrawal should revert if user has 0 balance", async() =>{
       await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 120]);
      await expect(bankContract.connect(addr1).withdraw()).to.be.revertedWith("You dont have any balance in the contract");
    })

    it("should withdraw deposit + share of first reward pool if third time interval hasnt been reached", async() => {
      amount = ethers.utils.parseEther('1000').toString()
      await tokenContract.mint(amount);
      await tokenContract.approve(bankContract.address, amount);
      await bankContract.deposit(amount);
      await tokenContract.connect(addr1).mint(amount);
      await tokenContract.connect(addr1).approve(bankContract.address, amount);
      await bankContract.connect(addr1).deposit(amount);
      let initialBal = await tokenContract.balanceOf(addr1.address);

      amount = ethers.utils.parseEther('4000').toString()
      await tokenContract.connect(addr2).mint(amount);
      await tokenContract.connect(addr2).approve(bankContract.address, amount);
      await bankContract.connect(addr2).deposit(amount);

      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 120]);
      await bankContract.connect(addr1).withdraw();
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(initialBal + ethers.utils.parseEther('1040'));
    })


    it("should withdraw deposit + share of first and second reward pool if fourth time interval hasnt been reached",
     async() => {
      amount = ethers.utils.parseEther('1000').toString();
      await tokenContract.mint(amount);
      await tokenContract.approve(bankContract.address, amount);
      await bankContract.deposit(amount);
      await tokenContract.connect(addr1).mint(amount);
      await tokenContract.connect(addr1).approve(bankContract.address, amount);
      await bankContract.connect(addr1).deposit(amount);

      amount = ethers.utils.parseEther('4000').toString();
      await tokenContract.connect(addr2).mint(amount);
      await tokenContract.connect(addr2).approve(bankContract.address, amount);
      await bankContract.connect(addr2).deposit(amount);
      let initialBal = await tokenContract.balanceOf(addr2.address);

      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 120]);
      await bankContract.connect(addr1).withdraw();
      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 80]);
      await bankContract.connect(addr2).withdraw();
      expect(await tokenContract.balanceOf(addr2.address)).to.equal(initialBal + ethers.utils.parseEther('4460'));
    })

     it("owner can withdraw the remaining amount if no user waits till the last period", async() => {
      amount = ethers.utils.parseEther('1000').toString();
      await tokenContract.mint(amount);
      await tokenContract.approve(bankContract.address, amount);
      await bankContract.deposit(amount);
      await tokenContract.connect(addr1).mint(amount);
      await tokenContract.connect(addr1).approve(bankContract.address, amount);
      await bankContract.connect(addr1).deposit(amount);

      amount = ethers.utils.parseEther('4000').toString();
      await tokenContract.connect(addr2).mint(amount);
      await tokenContract.connect(addr2).approve(bankContract.address, amount);
      await bankContract.connect(addr2).deposit(amount);

      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 120]);
      await bankContract.connect(addr1).withdraw();
      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 60]);
      await bankContract.connect(addr2).withdraw();
      let initialBal = await tokenContract.balanceOf(owner.address);
      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 60]);
      await bankContract.withdraw();
      expect(await tokenContract.balanceOf(owner.address)).to.equal(initialBal + ethers.utils.parseEther('500'));
    })

    it("token withdrawal should revert on contract's owner call if user(s) wait for the last period", async() =>{
      amount = ethers.utils.parseEther('1000').toString();
      await tokenContract.mint(amount);
      await tokenContract.approve(bankContract.address, amount);
      await bankContract.deposit(amount);
      await tokenContract.connect(addr1).mint(amount);
      await tokenContract.connect(addr1).approve(bankContract.address, amount);
      await bankContract.connect(addr1).deposit(amount);
      let initialBal = await tokenContract.balanceOf(addr1.address);
      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 240]);
      await expect(bankContract.withdraw()).to.be.revertedWith("bank owner can not remove money from the bank");
    });

    it("should withdraw all the remaining reward pool token if user waits for the last period", async() =>{
      amount = ethers.utils.parseEther('1000').toString();
      await tokenContract.mint(amount);
      await tokenContract.approve(bankContract.address, amount);
      await bankContract.deposit(amount);
      await tokenContract.connect(addr1).mint(amount);
      await tokenContract.connect(addr1).approve(bankContract.address, amount);
      await bankContract.connect(addr1).deposit(amount);
      let initialBal = await tokenContract.balanceOf(addr1.address);
      await ethers.provider.send('evm_increaseTime', [timeIntervalInMins * 240]);
      await bankContract.connect(addr1).withdraw()
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(initialBal + ethers.utils.parseEther('2000'));
    });
    });
    
});

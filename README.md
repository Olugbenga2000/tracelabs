<h3>This project is a hardhat project.</h3>
<h5> After cloning this repo, run npm install to download all the dependencies required for this project</h5>
<h2>Directories</h2>
<b>contract</b> -- The contract folder contains all the smart contracts written for this project . <br> To compile the contracts, run-- npx hardhat compile<br>
<b>test</b> -- The test folder contains the test file written for this project . <br> To test the contracts, run npx hardhat test<br><hr>

<p> <b>To deploy the project locally</b>, go to scripts/run.js and set the variable timeIntervalInMins to any preferred number. For local deployment we allow the token address to be set in constructor while ATRAC token address was hardcoded in the rinkeby testnet contract version
  run the command--- npx hardhat run scripts/run.js on the terminal <br><hr>
  
<p> <b>To deploy the project to rinkeby</b>,<br> create a .env file containing some variable declarations
  <br>STAGING_ALCHEMY_KEY= 'YOUR ALCHEMY KEY' <br>
PRIVATE_KEY='YOUR PRIVATE KEY' <br>go to scripts/deploy.js and set the variable timeIntervalInMins to any preferred number<br>
  run the command-- npx hardhat run scripts/deploy.js --network rinkeby on the terminal(The contract uses ATRAC token by default) <p>  
    The contract has been deployed to rinkeby on this address --- 0xA2394E5A617e3b1e130b27f02FbbbDF248449F10

document.addEventListener("DOMContentLoaded", function() {
  const menuItems = document.querySelectorAll('.sidebar a');
  const sections = document.querySelectorAll('.mainContent section');
  const connectButton = document.getElementById('connectWallet');
  const walletAddressDisplay = document.getElementById('walletAddressDisplay');
  const fundraisersList = document.getElementById('myFundraisersList');
  const donationHistoryList = document.getElementById('donationHistoryList');
  const uploadProfileImage = document.getElementById('profilePicUpload');
  const profileImage = document.getElementById('profilePicPreview');

  const factoryABI = [
      {
          "inputs": [],
          "name": "getMyFundraisers",
          "outputs": [
              {
                  "internalType": "address[]",
                  "name": "",
                  "type": "address[]"
              }
          ],
          "stateMutability": "view",
          "type": "function"
      },
      {
          "inputs": [
              {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
              },
              {
                  "internalType": "uint256",
                  "name": "targetAmount",
                  "type": "uint256"
              },
              {
                  "internalType": "uint256",
                  "name": "finishTime",
                  "type": "uint256"
              },
              {
                  "internalType": "string",
                  "name": "description",
                  "type": "string"
              }
          ],
          "name": "createFundraiser",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
      }
  ];

  const fundraiserABI = [
      {
          "inputs": [],
          "name": "name",
          "outputs": [
              {
                  "internalType": "string",
                  "name": "",
                  "type": "string"
              }
          ],
          "stateMutability": "view",
          "type": "function"
      },
      {
          "inputs": [],
          "name": "targetAmount",
          "outputs": [
              {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
              }
          ],
          "stateMutability": "view",
          "type": "function"
      },
      {
          "inputs": [],
          "name": "finishTime",
          "outputs": [
              {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
              }
          ],
          "stateMutability": "view",
          "type": "function"
      },
      {
          "inputs": [],
          "name": "description",
          "outputs": [
              {
                  "internalType": "string",
                  "name": "",
                  "type": "string"
              }
          ],
          "stateMutability": "view",
          "type": "function"
      },
      {
          "inputs": [],
          "name": "totalDonations",
          "outputs": [
              {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
              }
          ],
          "stateMutability": "view",
          "type": "function"
      }
  ];

  const factoryAddress = ethers.utils.getAddress('0xe35ebbd31389847e0a106ed8a903bed8f01fac0c'); // checksummed 주소

  async function connectWallet() {
      if (window.ethereum) {
          try {
              await window.ethereum.request({ method: 'eth_requestAccounts' });
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              const signer = provider.getSigner();
              const network = await provider.getNetwork();

              if (network.chainId !== 11155111) { // Sepolia network chain ID
                  alert('Please connect to the Sepolia network');
                  return;
              }

              const address = await signer.getAddress();
              walletAddressDisplay.textContent = `Connected: ${address}`;
              loadMyFundraisers(signer);
              loadDonationHistory(provider, signer);
          } catch (error) {
              console.error('Failed to connect to MetaMask:', error);
              alert('Failed to connect MetaMask. Please make sure it is installed and you are logged in.');
          }
      } else {
          alert('Please install MetaMask to use this feature.');
      }
  }

  async function loadMyFundraisers(signer) {
      const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);

      try {
          const myFundraisers = await factoryContract.getMyFundraisers();
          fundraisersList.innerHTML = '';

          if (myFundraisers.length === 0) {
              fundraisersList.innerHTML = '<li>No fundraisers found.</li>';
              return;
          }

          for (const fundraiserAddress of myFundraisers) {
              const fundraiserContract = new ethers.Contract(fundraiserAddress, fundraiserABI, signer);
              const name = await fundraiserContract.name();
              const targetAmount = ethers.utils.formatEther(await fundraiserContract.targetAmount());
              const finishTime = new Date((await fundraiserContract.finishTime()) * 1000).toLocaleDateString("en-US");
              const description = await fundraiserContract.description();
              const totalDonations = ethers.utils.formatEther(await fundraiserContract.totalDonations());

              const item = document.createElement('li');
              item.innerHTML = `<h3>${name}</h3>
                              <p>Description: ${description}</p>
                              <p>Target Amount: ${targetAmount} ETH</p>
                              <p>Total Donations: ${totalDonations} ETH</p>
                              <p>Finish Time: ${finishTime}</p>`;
              fundraisersList.appendChild(item);
          }
      } catch (error) {
          console.error('Error loading my fundraisers:', error);
          fundraisersList.innerHTML = '<li>Failed to load my fundraisers. Error: ' + error.message + '</li>';
      }
  }

  async function loadDonationHistory(provider, signer) {
      const donationsContractAddress = '0xYOUR_DONATIONS_CONTRACT_ADDRESS'; // Update this with the actual contract address
      const donationsContractABI = [
          {
              "constant": true,
              "inputs": [{"name": "donor", "type": "address"}],
              "name": "donations",
              "outputs": [{"name": "amount", "type": "uint256"}],
              "payable": false,
              "stateMutability": "view",
              "type": "function"
          },
      ];
      const donationsContract = new ethers.Contract(donationsContractAddress, donationsContractABI, signer);

      try {
          const address = await signer.getAddress();
          const donationAmount = await donationsContract.donations(address);
          if (!donationAmount || donationAmount.isZero()) {
              donationHistoryList.innerHTML = '<li>No donations made.</li>';
          } else {
              donationHistoryList.innerHTML = '';
              const item = document.createElement('li');
              item.innerHTML = `Total Donated: ${ethers.utils.formatEther(donationAmount)} ETH`;
              donationHistoryList.appendChild(item);
          }
      } catch (error) {
          console.error('Error loading donation history:', error);
          donationHistoryList.innerHTML = '<li>Failed to load donation history. Error: ' + error.message + '</li>';
      }
  }

  function uploadProfilePicture(event) {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
              profileImage.src = e.target.result;
          };
          reader.readAsDataURL(file);
      }
  }

  connectButton.addEventListener('click', connectWallet);
  uploadProfileImage.addEventListener('change', uploadProfilePicture);

  menuItems.forEach(item => {
      item.addEventListener('click', function(event) {
          event.preventDefault();
          sections.forEach(section => section.style.display = 'none');
          const activeSection = document.getElementById(item.id.replace('Menu', 'Section'));
          if (activeSection) {
              activeSection.style.display = 'block';
          }
      });
  });
});

 
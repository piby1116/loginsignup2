import { LoadingAnimation } from './LoadingAnimation.js';

function getCurrentDateTime() {
    const now = new Date();
    const dateTimeLocal = now.toISOString().slice(0, 16);
    return dateTimeLocal;
}

document.addEventListener('DOMContentLoaded', async function () {
    const animation = new LoadingAnimation('../images/loadingAnimation.json');
    await animation.loadAnimation();

    try {
        animation.startTask();
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log('Provider and signer initialized.');

        const fundraiserFactoryAddress = "0xe35ebbd31389847e0a106ed8a903bed8f01fac0c"; // Updated Address
        const fundraiserFactoryABI = [
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "fundraiserAddress",
                        "type": "address"
                    }
                ],
                "name": "FundraiserCreated",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "string",
                        "name": "_name",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_targetAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_finishTime",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "_description",
                        "type": "string"
                    }
                ],
                "name": "createFundraiser",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "fundraisers",
                "outputs": [
                    {
                        "internalType": "contract Fundraiser",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getFundraisers",
                "outputs": [
                    {
                        "internalType": "contract Fundraiser[]",
                        "name": "",
                        "type": "address[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        const fundraiserFactory = new ethers.Contract(fundraiserFactoryAddress, fundraiserFactoryABI, signer);
        console.log('Contract initialized.');

        // FundraiserCreated 이벤트 리스너
        fundraiserFactory.on("FundraiserCreated", (fundraiserAddress) => {
            console.log(`New Fundraiser Created at: ${fundraiserAddress}`);
            alert(`New Fundraiser Created at: ${fundraiserAddress}`);
        });

        document.getElementById('registerFundraiser').addEventListener('click', async function() {
            animation.startTask();
            const name = document.getElementById('fundraiserName').value;
            const targetAmountInput = document.getElementById('fundraiserTargetAmount').value;
            const targetAmount = ethers.utils.parseUnits(targetAmountInput, 'gwei');
            console.log('Target Amount (Ether):', targetAmount);

            const finishTimeElement = document.getElementById('fundraiserFinishTime');
            finishTimeElement.min = getCurrentDateTime();
            const finishTimeInput = finishTimeElement.value;
            if (!finishTimeInput) {
                console.error('Finish time is not provided.');
                alert('Please provide a finish time.');
                animation.endTask();
                return;
            }
            const finishTimeUnix = Math.floor(new Date(finishTimeInput).getTime() / 1000);
            console.log('Finish Time (Unix):', finishTimeUnix);

            const description = document.getElementById('fundraiserDescription').value;

            try {
                const transactionResponse = await fundraiserFactory.createFundraiser(name, targetAmount, finishTimeUnix, description);
                await transactionResponse.wait();
                console.log('Fundraiser created:', transactionResponse);
                alert('Fundraiser has been registered successfully!');
            } catch (error) {
                console.error('Failed to register fundraiser:', error);
                alert('Error registering the fundraiser. Please check the console for more details.');
            } finally {
                animation.endTask();
            }
        });

    } catch (error) {
        console.error("Error initializing application:", error);
    } finally {
        animation.endTask();
    }
});

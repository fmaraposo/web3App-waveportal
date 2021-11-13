import { ethers } from "ethers"; //library that helps our frontend talk to our contract
import React, { useEffect, useState } from "react";
import './App.css';
import abi from './utils/WavePortal.json'

const App = () => {

  const [allWaves, setAllWaves] = useState([])
  const [message, setMessage] = useState('')

  const contractAddress = '0x9F3eEA739a2Ac999c6545eF57a7DEd2ffEA7ae4E';
  const contractABI = abi.abi

  const [currentAccount, setCurrentAccount] = useState('')

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        setAllWaves(wavesCleaned)
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const checkIfWalletIsConnected = async () => {

    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make  sure you have metamask!');
      } else {
        console.log('We have the ethereum object', ethereum)
      }

      //check if we're authorized to access any of the accounts in the user's wallet
      const accounts = await ethereum.request({ method: 'eth_accounts' })

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account', account)
        setCurrentAccount(account)
        getAllWaves()
      } else {
        console.log('No authorized account found')
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return
      }

      // asking Metamask to give me access to the user's wallet.
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);

    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner(); //provider is to talk with eth nodes
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log('Mining...', waveTxn.hash);

        await waveTxn.wait();
        console.log('Mined -- ', waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log('Ethereum object does not exist!')
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          Hey 👋  I'm Francisco!
        </div>

        <div className="bio">
         I'm web developer, gaining some knowledge on the Ethereum blockchain & Web3! 
         Wanna interact with the blockchain? 
         Connect your wallet, write your message, and wave at me 🚀
        </div>

        <div className="message">
          <textarea className="message-textarea" onChange={(e) => setMessage(e.target.value)}>
          </textarea>
          <button className="waveButton" onClick={wave}>
            Wave Me!
          </button>
        </div>


        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
          {allWaves.map((wave, index) => {
            return (
              <div className='waves' key={index} style={{display:'flex'}}>
                <div className='wave-details address'>
                  <span className='wave-details-headers'>Waver</span>
                  <span className='wave-details-content'>{wave.address}</span>
                </div>
                <div className='wave-details time'>
                  <span className='wave-details-headers'>Time</span>
                  <span className='wave-details-content'>{wave.timestamp.toString()}</span>
                </div>
                <div className='wave-details waveMessages'>
                  <span className='wave-details-headers'>Message</span>
                  <span className='wave-details-content'>{wave.message}</span>
                </div>
              </div>
              )})
            }
      </div>
    </div>
  );
}

export default App;

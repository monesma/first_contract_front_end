import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useMainContract } from './hooks/useMainContract'
import { useTonConnect } from './hooks/useTonConnect'
import { fromNano } from 'ton-core'

function App() {

  const {
    contract_address,
    counter_value,
    contract_balance,
    sendIncrement,
    sendDeposit,
    sendWithdrawalRequest
  } = useMainContract()

  const { connected } = useTonConnect()
  
  return (
    <>
      <header>
        <TonConnectButton />
      </header>
      <main>
        <div className="Card">
          <b>Our contract address</b>
          <p className="Hint">{contract_address?.slice(0,30) + "..."}</p>
          <b>Our contract Balance</b>
          <p className='Hint'>{contract_balance !== null ? fromNano(contract_balance) : ""}</p>
        </div>
        <div className='Card'>
          <b>Counter value</b>
          <p>{counter_value ?? "Loading..."}</p>
        </div>

        {connected && (
          <a href="" onClick={(e)=>{
            e.preventDefault()
            sendIncrement()
          }}>
            Increment by 5
          </a>
        )}

        <br/>

        {connected && (
          <a href="" onClick={(e)=>{
            e.preventDefault()
            sendDeposit()
          }}>
            Request deposit of 1 TON
          </a>
        )}

        <br/>

        {connected && (
          <a href="" onClick={(e)=>{
            e.preventDefault()
            sendWithdrawalRequest()
          }}>
            Request 0.7 TON withdrawal
          </a>
        )}
      </main>
    </>
  )
}

export default App

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io();


function App() {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const socket = io();

  useEffect(()=>{
    socket.once('connect', () => {
      console.log('Socket.IO connection established');
    });

    socket.on('message', (event: MessageEvent) => {
      const data = JSON.parse(event.data); 
      setMessage(data);
    });

    return () => {
      socket.removeAllListeners('message');
      socket.disconnect();
    };
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void{
    if(e.target && typeof e.target.value === 'string'){
      setInput(e.target.value)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    socket.emit('command', input);
  }
  return (
    <>
      <h1>Client</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" onChange={handleInputChange} placeholder="Enter 'ls' command" required />
        <button type="submit">Send</button>
      </form>
      {
        message.length !== 0 ? (
        <div id="result">${message}</div>
        ) : <div id="result"></div>
      }

    </>
  )
}

export default App

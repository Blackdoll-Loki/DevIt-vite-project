import React from 'react';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');


function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(()=>{
    socket.on('connect', () => {
      console.log('Socket.IO connection established');
    });

    // socket.on('message', (event: MessageEvent) => {
    //   const data = JSON.parse(event.data); 
    //   setMessage(data);
    // });
    socket.on('welcome', (message) => {
      console.log('Message from server:', message);
    });

    socket.on('ping', (message) => {
      console.log('Ping from server:', message);
    });

    socket.on('message', (message) => {
      console.log('Message from server:', message);
      setOutput(message);
      console.log(message)
    });

    socket.onAny((event, ...args) => {
      console.log(`Event received: ${event}, with args: ${args}`);
    });
    return () => {
      socket.removeAllListeners('message');
      socket.disconnect();
    };
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void{
    setInput(e.target.value)
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
      <div id="result">{output}</div>
    </>
  )
}

export default App

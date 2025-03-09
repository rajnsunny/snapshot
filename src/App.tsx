import React from 'react';
import { PhotoBooth } from './components/PhotoBooth';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #121212;
    color: white;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
  }
`;

function App() {
  return (
    <>
      <GlobalStyle />
      <PhotoBooth />
    </>
  );
}

export default App;

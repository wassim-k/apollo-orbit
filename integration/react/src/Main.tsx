import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { ApolloProvider } from '@apollo/client/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.scss';
import App from './App.tsx';
import { client } from './graphql';
import './index.scss';
import { authorState } from './library/states/author.state';
import { bookState } from './library/states/book.state';
import { themeState } from './states/theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <ApolloOrbitProvider states={[authorState, bookState, themeState]}>
        <App />
      </ApolloOrbitProvider>
    </ApolloProvider>
  </StrictMode>
);

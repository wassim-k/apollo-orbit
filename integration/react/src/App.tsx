import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { ApolloProvider } from '@apollo/client';
import React from 'react';
import './App.scss';
import { Books } from './books/Books';
import { authorState } from './books/states/author.state';
import { bookState } from './books/states/book.state';
import { client } from './graphql';
import { Session } from './Session';
import { sessionState } from './states/session';

function App() {
  return (
    <ApolloProvider client={client}>
      <ApolloOrbitProvider states={[authorState, bookState, sessionState]}>
        <Session></Session>
        <Books></Books>
      </ApolloOrbitProvider>
    </ApolloProvider>
  );
}

export default App;

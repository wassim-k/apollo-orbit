import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { ApolloProvider } from '@apollo/client';
import './App.scss';
import { Main } from './Main';
import { client } from './graphql';
import { authorState } from './library/states/author.state';
import { bookState } from './library/states/book.state';
import { themeState } from './states/theme';

function App() {
  return (
    <ApolloProvider client={client}>
      <ApolloOrbitProvider states={[authorState, bookState, themeState]}>
        <Main />
      </ApolloOrbitProvider>
    </ApolloProvider>
  );
}

export default App;

import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { Query } from '@apollo-orbit/react/components';
import { ApolloProvider } from '@apollo/client';
import './App.scss';
import { Books } from './books/Books';
import { authorState } from './books/states/author.state';
import { bookState } from './books/states/book.state';
import { client } from './graphql';
import { themeState } from './states/theme';
import { ThemeDocument } from './states/theme/gql/theme';
import { Theme } from './Theme';

function App() {
  return (
    <ApolloProvider client={client}>
      <ApolloOrbitProvider states={[authorState, bookState, themeState]}>
        <Query query={ThemeDocument}>
          {result =>
            <div className={`main ${result.data?.theme.name.toLowerCase()}`}>
              <Theme></Theme>
              <Books></Books>
            </div>
          }
        </Query>
      </ApolloOrbitProvider>
    </ApolloProvider>
  );
}

export default App;

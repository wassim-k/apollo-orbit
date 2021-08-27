import { ApolloError } from 'apollo-server';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { Book } from '../types';
import { Resolvers, SubscriptionNewBookArgs } from './types';

const delay = <T>(value: T, duration: number): Promise<T> => new Promise<T>(resolve => {
  setTimeout(() => resolve(value), duration);
});

const delayError = <T>(duration: number): Promise<T> => new Promise<T>((_resolve, reject) => {
  setTimeout(() => reject(new Error('Failed to get data')), duration);
});

const NEW_BOOK = 'NEW_BOOK';
const NEW_AUTHOR = 'NEW_AUTHOR';

const pubsub = new PubSub();

export const resolvers: Resolvers = {
  Query: {
    book: (_parent, args, context) => {
      return context.books.getById(args.id);
    },
    books: (_parent, args, context) => {
      return true as boolean
        ? delay(context.books.getAll(args), 1000)
        : delayError(1000);
    },
    author: (_parent, args, context) => {
      return context.authors.getById(args.id);
    },
    authors: (_parent, _args, context) => {
      return context.authors.getAll();
    }
  },
  Book: {
    author: (parent, _args, context) => {
      return context.authors.getById(parent.authorId);
    }
  },
  Author: {
    books: (parent, _args, context) => {
      return context.books.getAll({ authorId: parent.id });
    }
  },
  Mutation: {
    addAuthor: (_parent, { author }, context) => {
      const newAuthor = context.authors.addAuthor(author);
      void pubsub.publish(NEW_AUTHOR, { newAuthor });
      return newAuthor;
    },
    addBook: (_parent, { book }, context) => {
      const error: boolean = false as boolean;
      if (error) throw new ApolloError('Failed to add book');
      const newBook = context.books.addBook(book);
      void pubsub.publish(NEW_BOOK, { newBook });
      return newBook;
    }
  },
  Subscription: {
    newBook: {
      subscribe: withFilter(
        (_parent, _args, _context, _info) => {
          return pubsub.asyncIterator([NEW_BOOK]);
        },
        (payload: Book, variables: SubscriptionNewBookArgs) => {
          return typeof variables.authorId !== 'string' || payload.authorId === variables.authorId;
        }
      )
    },
    newAuthor: {
      subscribe: (_parent, _args, _context, _info) => {
        return pubsub.asyncIterator([NEW_AUTHOR]);
      }
    }
  }
};

import { PubSub, withFilter } from 'graphql-subscriptions';
import { Resolvers, Subscription } from './types.js';

const delay = <T>(value: T, duration = 500): Promise<T> => new Promise<T>(resolve => {
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
      return args.name === 'Error'
        ? delayError(1000)
        : delay(context.books.getAll(args));
    },
    author: (_parent, args, context) => {
      return context.authors.getById(args.id);
    },
    authors: (_parent, args, context) => {
      return args.name === 'Error'
        ? delayError(1000)
        : delay(context.authors.getAll(args));
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
      const addedAuthor = context.authors.addAuthor(author);
      const newAuthor = { ...addedAuthor, books: [] };
      void pubsub.publish(NEW_AUTHOR, { newAuthor });
      return delay(newAuthor);
    },
    updateAuthor: (_parent, { id, author }, context) => {
      return delay(context.authors.updateAuthor(id, author));
    },
    addBook: (_parent, { book }, context) => {
      const newBook = context.books.addBook(book);
      void pubsub.publish(NEW_BOOK, { newBook });
      return delay(newBook);
    },
    updateBook: (_parent, { id, book }, context) => {
      return delay(context.books.updateBook(id, book));
    }
  },
  Subscription: {
    newBook: {
      subscribe: withFilter(
        (_parent, _args, _context, _info) => {
          return pubsub.asyncIterableIterator([NEW_BOOK]);
        },
        (payload, variables) => {
          return typeof variables?.authorId !== 'string' || (payload as Subscription).newBook.authorId === variables.authorId;
        }
      )
    },
    newAuthor: {
      subscribe: (_parent, _args, _context, _info) => {
        return {
          [Symbol.asyncIterator]: () => pubsub.asyncIterableIterator([NEW_AUTHOR])
        };
      }
    }
  }
};

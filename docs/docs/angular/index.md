---
sidebar_position: 1
---

import Link from '@docusaurus/Link'

# Introduction
**Apollo Orbit** is a fully-featured **<Link to="https://www.apollographql.com/docs/react/">Apollo Client</Link>** for **<Link to="https://angular.io/">Angular</Link>**.

**<Link to="https://www.apollographql.com/docs/react/">Apollo Client</Link>** is a GraphQL client with advanced caching capabilities which can be used to fetch, cache, and modify application data, all while automatically updating your Angular UI.

**Apollo Orbit** brings the power of **Apollo Client** to **Angular** and combines it with Redux/NGXS concepts for state management.  

## Features

### General
* **Fully-featured** implementation of **Apollo Client** for **Angular** with focus on **optimal developer experience**.
* **Seamless integration** with Angular framework and **RxJS**.
* **Strongly typed:** `@apollo-orbit/codegen` package generates typescript code for queries, mutations & subscriptions catching any breaking changes in the GraphQL schema at compile time.
* **Battle tested and production ready:** used in production environment for 3+ years.

### State Management
* **Comprehensive state management**: **Apollo Orbit** combines the strengths of **Apollo Client** and traditional state management libraries, providing a unified solution for managing both local and remote data.
* **Decoupling**: Separate state management code from component code using modular `state` definitions and `action` handlers.
* **Modular:** Each `state` definition manage its own slice of the cache.
* **Separation of concerns (SoC):** Different `state` slices can handle the same `Mutation` or `Action` independently.
* **Event-driven architecture:** **Apollo Orbit** `@Action`s enable event driven application design.
* **Testability:** `state` logic can be tested in isolation, enhancing testability.

## Docs
The docs are designed to supplement <Link to="https://www.apollographql.com/docs/react/">Apollo Client docs</Link>, with focuses on the **Angular** specific API and features implemented by **Apollo Orbit**.  
For a comprehensive understanding of all available options, features and guides, we recommend referring to <Link to="https://www.apollographql.com/docs/react/">Apollo Client docs</Link>.

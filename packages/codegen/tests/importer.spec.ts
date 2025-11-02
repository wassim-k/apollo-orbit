import { describe, expect, it } from 'vitest';
import { Importer } from '../src/internal/importer.js';

describe('Importer', () => {
  it('should generate imports with proper sorting, aliases, and deduplication', () => {
    const importer = new Importer();

    // Register imports in non-alphabetical order with various scenarios
    importer.registerImport('useState', 'react');
    importer.registerImport('useEffect', 'react');
    importer.registerImport('Component', 'react');
    importer.registerImport('TypedDocumentNode', '@apollo/client', 'DocumentNode');
    importer.registerImport('gql', '@apollo/client');
    importer.registerImport('gql', '@apollo/client'); // duplicate
    importer.registerImport('ApolloClient', '@apollo/client', 'Client');
    importer.registerImport('Injectable', '@angular/core');
    importer.registerImport('z', 'module-z');
    importer.registerImport('b', 'module-a');
    importer.registerImport('a', 'module-a');

    const imports = importer.getImports();

    // Should be sorted alphabetically by module name
    expect(imports[0]).toBe('import { Injectable } from \'@angular/core\';');
    expect(imports[1]).toBe('import { ApolloClient as Client, gql, TypedDocumentNode as DocumentNode } from \'@apollo/client\';');
    expect(imports[2]).toBe('import { a, b } from \'module-a\';');
    expect(imports[3]).toBe('import { z } from \'module-z\';');
    expect(imports[4]).toBe('import { Component, useEffect, useState } from \'react\';');
  });

  it('should handle empty imports', () => {
    const importer = new Importer();

    const imports = importer.getImports();

    expect(imports).toEqual([]);
  });
});

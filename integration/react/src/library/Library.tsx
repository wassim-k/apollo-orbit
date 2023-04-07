import React, { Suspense, useState } from 'react';
import { Authors } from './Authors';
import { Books } from './Books';
import './Library.scss';
import { NewAuthor } from './NewAuthor';
import { NewBook } from './NewBook';

const Lazy = React.lazy(() => import('../lazy/Lazy'));

export function Library() {
    const [isAddingBook, setIsAddingBook] = useState(false);
    const [isAddingAuthor, setIsAddingAuthor] = useState(false);
    const [showLazy, setShowLazy] = useState(false);

    return (
        <>
            <Books></Books>
            <Authors></Authors>
            <br />
            <button onClick={() => setIsAddingBook(true)}>Add Book</button>
            &nbsp;
            <button onClick={() => setIsAddingAuthor(true)}>Add Author</button>
            {isAddingBook && <div className="form-container" style={{ marginTop: '5px' }}>
                <NewBook onClose={() => setIsAddingBook(false)}></NewBook>
            </div>}
            {isAddingAuthor && <div className="form-container" style={{ marginTop: '5px' }}>
                <NewAuthor onClose={() => setIsAddingAuthor(false)}></NewAuthor>
            </div>}
            <br />
            <br />
            {!showLazy && <button onClick={() => setShowLazy(true)}>Go to lazy</button>}
            {showLazy && <button onClick={() => setShowLazy(false)}>Go back</button>}
            {showLazy && <div>
                <Suspense fallback={<div>Loading...</div>}>
                    <Lazy />
                </Suspense>
            </div>}
        </>
    );
}

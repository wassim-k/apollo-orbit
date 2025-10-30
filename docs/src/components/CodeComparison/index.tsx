import CodeBlock from '@theme/CodeBlock';
import React from 'react';
import styles from './styles.module.css';

interface CodeComparisonProps {
  leftCode: string;
  rightCode: string;
  leftLanguage?: string;
  rightLanguage?: string;
  leftTitle?: string;
  rightTitle?: string;
}

export default function CodeComparison({
  leftCode,
  rightCode,
  leftLanguage,
  rightLanguage,
  leftTitle,
  rightTitle
}: CodeComparisonProps): React.JSX.Element {
  const langLeft = leftLanguage ? `language-${leftLanguage}` : '';
  const langRight = rightLanguage ? `language-${rightLanguage}` : '';

  return (
    <div className={styles.comparisonContainer}>
      <div className={styles.comparisonColumn}>
        <CodeBlock className={langLeft} title={leftTitle}>{leftCode}</CodeBlock>
      </div>
      <div className={styles.comparisonColumn}>
        <CodeBlock className={langRight} title={rightTitle}>{rightCode}</CodeBlock>
      </div>
    </div>
  );
}

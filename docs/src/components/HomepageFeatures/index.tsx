/* eslint-disable @typescript-eslint/no-require-imports */

import Link from '@docusaurus/Link';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.css';

interface FeatureItem {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: React.JSX.Element;
  url: string;
}

const FeatureList: Array<FeatureItem> = [
  {
    title: 'Angular',
    url: '/docs/angular',
    Svg: require('@site/static/img/angular.svg').default,
    description: (
      <>
        A full-featured GraphQL client for Angular
      </>
    )
  },
  {
    title: 'React',
    url: '/docs/react',
    Svg: require('@site/static/img/react.svg').default,
    description: (
      <>
        Apollo Client modular state management abstraction for React
      </>
    )
  }
];

function Feature({ title, Svg, description, url }: FeatureItem) {
  return (
    <div className={clsx('col col--6')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md padding-bottom--md">
        <h3>{title}</h3>
        <p>{description}</p>
        <Link
          className="button button--secondary button--lg"
          to={url}>
          Explore {title} docs
        </Link>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

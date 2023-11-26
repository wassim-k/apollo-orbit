import { useDispatch } from '@apollo-orbit/react';
import { useQuery } from '@apollo/client';
import { ThemeDocument } from './graphql';
import { ToggleThemeAction } from './states/theme/theme.actions';

export function Theme() {
  const dispatch = useDispatch();
  const { data: themeData } = useQuery(ThemeDocument);

  return (
    <div>
      <span>Current theme:</span>
      &nbsp;
      <b>{themeData?.theme.displayName}</b>
      &nbsp;
      <button onClick={() => dispatch<ToggleThemeAction>({ type: 'theme/toggle' })}>Toggle theme</button>
    </div>
  );
}

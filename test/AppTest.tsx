import React from 'react';
import renderer from 'react-test-renderer';

import App from '../src/App';

jest.unmock('ScrollView');
jest.mock('WebView', () => 'WebView');
jest.mock('react-native-settings-list', () => 'react-native-settings-list');

it('renders without crashing', () => {
  const rendered = renderer.create(<App />).toJSON();
  expect(rendered).toBeTruthy();
});

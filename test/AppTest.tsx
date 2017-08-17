import React from 'react';
import App from '../src/App';

import renderer from 'react-test-renderer';

jest.unmock('ScrollView');
jest.mock('WebView', () => 'WebView')
jest.mock('react-native-fetch-blob', () => {
  return {
    DocumentDir: () => {},
    ImageCache: {
      get: {
        clear: () => {}
      }
    }
  }
})

global.fetch = require('jest-fetch-mock');

it('renders without crashing', () => {
  const rendered = renderer.create(<App />).toJSON();
  expect(rendered).toBeTruthy();
});

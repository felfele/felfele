import React from 'react';
import renderer from 'react-test-renderer';

jest.unmock('ScrollView');
jest.mock('WebView', () => 'WebView');
jest.mock('react-native-settings-list', () => 'react-native-settings-list');
jest.mock('redux', () => ({
  createStore: () => ({
    dispatch: jest.fn(),
    getState: jest.fn(),
    subscribe: jest.fn(),
  }),
  combineReducers: jest.fn(),
  applyMiddleware: jest.fn(),
  compose: jest.fn(),
}));
jest.mock('redux-persist', () => ({
  persistReducer: jest.fn(),
  persistStore: () => ({
    subscribe: jest.fn(),
    getState: () => ({
      bootstrapped: true,
    }),
  }),
}));
jest.mock('../src/reducers/immutableTransform', () => ({
  immutableTransform: jest.fn(),
}));
jest.mock('react-navigation/src/views/assets/back-icon.png', () => ({}));

import App from '../src/App';

it('renders without crashing', () => {
  const rendered = renderer.create(<App />).toJSON();
  expect(rendered).toBeTruthy();
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Message from './Message';

const fomoMessage =
  'Fomo Pool timer is over and currently pending fomo pool owner to collect the fomo rewards. Will resume the game upon user collected the rewards';

beforeEach(() => {
  render(<Message message={fomoMessage} />);
});

test('The heading component is visible', () => {
  const linkElement = screen.getByRole('heading');
  expect(linkElement).toBeVisible();
});

test('Render message in H2 header as expected', () => {
  const linkElement = screen.getByRole('heading');
  expect(linkElement.tagName).toEqual('H2');
});

test('Rendered message element is not empty', () => {
  const linkElement = screen.getByRole('heading');
  expect(linkElement).not.toBeEmptyDOMElement();
});

test('Render message as expected', () => {
  const linkElement = screen.getByRole('heading');
  expect(linkElement).toContainHTML(`<h2>${fomoMessage}</h2>`);
});

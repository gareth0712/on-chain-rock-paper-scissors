import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RpsForm from './RpsForm';

// Host is player2
const host = '0x68b7535dc90C13054073cF05f0422B7758985341';
const player1 = '0x21a0409e66bC90a8e77D5Fbc629Cad5A114E317e';
const player2 = '0x68b7535dc90C13054073cF05f0422B7758985341';

test('renders Heading in RpsForm', () => {
  render(<RpsForm />);
  const linkElement = screen.getByRole('heading');
  expect(linkElement).toBeVisible();
});

test('Textbox is visible', () => {
  render(<RpsForm />);
  const linkElement = screen.getByRole('textbox');
  expect(linkElement).toBeVisible();
});

test('Button is enabled by default', () => {
  render(<RpsForm />);
  const linkElement = screen.getByRole('button');
  expect(linkElement).toBeEnabled();
});

test('Button is disabled when it is hostOnly and player is not a host', () => {
  render(<RpsForm hostOnly={true} player={player1} host={host} />);
  const linkElement = screen.getByRole('button');
  expect(linkElement).not.toBeEnabled();
});

test('Button is enabled when it is hostOnly and player is a host', () => {
  render(<RpsForm hostOnly={true} player={player2} host={host} />);
  const linkElement = screen.getByRole('button');
  expect(linkElement).toBeEnabled();
});

test('Display header as expected', () => {
  const header = 'Add Bankroll';
  render(<RpsForm header={header} />);
  const linkElement = screen.getByRole('heading');
  expect(linkElement).toContainHTML(`<h4>${header}</h4>`);
});

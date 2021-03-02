import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RpsForm from '../components/RpsForm';

beforeEach(() => {
  render(<RpsForm />);
});

test('renders Heading in RpsForm', () => {
  const linkElement = screen.getByRole('heading');
  expect(linkElement).toBeVisible();
});

test('Textbox is visible', () => {
  const linkElement = screen.getByRole('textbox');
  expect(linkElement).toBeVisible();
});

test('Button is enabled', () => {
  const linkElement = screen.getByRole('button');
  expect(linkElement).toBeEnabled();
});

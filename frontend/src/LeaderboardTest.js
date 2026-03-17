import { render, screen } from '@testing-library/react';
import Leaderboard from './Leaderboard';
import { getLeaderboard } from '../services/LeaderboardService';

jest.mock('../services/LeaderboardService');

test('renders leaderboard header and student data', async () => {
  getLeaderboard.mockResolvedValue([
    { id: 1, name: 'Luca', hours: 50 },
    { id: 2, name: 'Nick', hours: 40 },
  ]);

  render(<Leaderboard />);

  expect(screen.getByText(/Leaderboard/i)).toBeInTheDocument();
  expect(await screen.findByText('Luca')).toBeInTheDocument();
  expect(await screen.findByText('Nick')).toBeInTheDocument();
});
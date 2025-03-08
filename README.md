# Crypto Portfolio Tracker

A modern cryptocurrency portfolio tracking application that integrates with major exchanges to provide real-time monitoring of your digital assets. Currently supporting Binance and Bitget, with ongoing development for additional exchange integrations.

## Project Overview

Built with cutting-edge technologies:

- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL with Supabase
- **Frontend**: Next.js (In development)
- **Currently Supported Exchanges**: 
  - Binance
  - Bitget
  - More exchanges coming soon

## Current Features

- Live portfolio tracking for Binance and Bitget
- Automated daily portfolio snapshots
- Portfolio history tracking
- Real-time USD value conversion
- Cross-exchange asset aggregation
- Support for multiple API keys per exchange

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Exchange API keys with read access

### Backend Setup

1. Clone and enter the repository:
   ```bash
   git clone https://github.com/yourusername/crypto-tracker.git
   cd crypto-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment:
   Create a `.env` file with:
   ```env
   # Database
   DATABASE_URL=your_supabase_url
   
   # Exchange APIs
   BINANCE_API_KEY=your_binance_key
   BINANCE_SECRET_KEY=your_binance_secret
   
   BITGET_API_KEY=your_bitget_key
   BITGET_SECRET_KEY=your_bitget_secret
   BITGET_PASSWORD=your_bitget_password
   ```

4. Launch the development server:
   ```bash
   npm run dev
   ```

### Frontend

The Next.js frontend is currently under development. Stay tuned for updates!

## API Documentation

API documentation is available at `/api/docs` when running the development server.

## Development Status

### Current Focus

- Implementing Next.js frontend
- Adding more exchange integrations
- Enhancing portfolio analytics
- Improving error handling and reliability

### Roadmap

1. Complete frontend implementation
2. Add support for DeFi protocols
3. Implement portfolio performance metrics
4. Add email notifications for significant portfolio changes

## Security

- API keys are stored securely using environment variables
- All API requests are rate-limited
- Regular security audits are performed
- Dependencies are automatically updated via Dependabot

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description

## License

MIT License - feel free to use and modify as needed.

## Support

For issues and feature requests, please use the GitHub issues tracker.

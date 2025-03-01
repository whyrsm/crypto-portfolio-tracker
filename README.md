# Crypto Portfolio Tracker

A comprehensive application to monitor cryptocurrency portfolios across multiple exchanges including Binance, Bitget and Hyperliquid. This application provides real-time tracking and visualization of your crypto assets across different trading platforms.

## Project Overview

The Crypto Portfolio Tracker is built with a modern tech stack:

- **Backend**: NestJS (Node.js framework)
- **Database**: Supabase (PostgreSQL)
- **Frontend**: (To be implemented)
- **Supported Exchanges**: 
  - Binance (Multiple accounts)
  - Bitget
  - Hyperliquid
  - More exchanges to be added

## Features

- Real-time portfolio tracking across multiple exchanges
- Daily portfolio snapshots
- Historical portfolio data
- USD value conversion for all assets
- Asset aggregation across exchanges
- Multiple Binance account support

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd crypto-tracker-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the backend directory with the following variables:
   ```env
   # Binance API Credentials
   BINANCE_API_KEY=your_binance_api_key
   BINANCE_SECRET_KEY=your_binance_secret_key

   # Bitget API Credentials
   BITGET_API_KEY=your_bitget_api_key
   BITGET_SECRET_KEY=your_bitget_secret_key
   BITGET_PASSWORD=your_bitget_password
   ```

4. Start the development server:
   ```bash
   npm run start:dev
   ```

### Frontend Setup

(To be implemented)

## API Documentation

(Will be added)

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- API keys from supported exchanges

### Adding New Exchange Support

The application is designed to be extensible. To add support for a new exchange:

1. Add the exchange credentials to the configuration service
2. Create a new service for the exchange integration
3. Update the portfolio service to include the new exchange

## Security Considerations

- Never commit API keys to version control
- Use environment variables for sensitive data
- Implement rate limiting for API calls
- Keep dependencies updated

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
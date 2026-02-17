#!/bin/bash

echo "🚀 Setting up P.A.L. Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm or bun is available
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    echo "✅ Using Bun package manager"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo "✅ Using npm package manager"
else
    echo "❌ No package manager found. Please install npm or bun."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
$PKG_MANAGER install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your credentials"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

# Create uploads directory
mkdir -p uploads
echo "✅ Created uploads directory"

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Start Redis: redis-server"
echo "3. Start ChromaDB: docker run -p 8000:8000 chromadb/chroma"
echo "4. Run migrations: $PKG_MANAGER run db:migrate"
echo "5. Start dev server: $PKG_MANAGER run dev"
echo ""

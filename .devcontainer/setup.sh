echo "🚀 Configurando ambiente do Frontend..."

npm install

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    echo "VITE_API_URL=http://localhost:3000" > .env
  fi
fi

echo "✅ Ambiente Front-end pronto para codar!"
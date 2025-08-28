// App.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
  };
  types: {
    type: {
      name: string;
    };
  }[];
  description?: string;
}

const typeColors: { [key: string]: string } = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

export default function App() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const limit = 9;
  const TOTAL_POKEMONS = 1025;
  const totalPages = Math.ceil(TOTAL_POKEMONS / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const pokemonCache = useRef<Map<number, Pokemon>>(new Map());

  useEffect(() => {
    fetchPokemons();
  }, [offset]);

  const fetchPokemons = async () => {
    try {
      const lastId = Math.min(offset + limit, TOTAL_POKEMONS);
      const ids = Array.from({ length: lastId - offset }, (_, i) => i + 1 + offset);
      const detailedPokemons: Pokemon[] = await Promise.all(
        ids.map(async (id) => {
          if (pokemonCache.current.has(id)) {
            return pokemonCache.current.get(id)!;
          }

          const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const data = res.data;

          const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
          const flavor = speciesRes.data.flavor_text_entries.find(
            (entry: any) => entry.language.name === 'en'
          );

          const pokemon: Pokemon = {
            ...data,
            description: flavor?.flavor_text.replace(/\f/g, ' ') || 'No description available.',
          };

          pokemonCache.current.set(id, pokemon);
          return pokemon;
        })
      );

      setPokemons(detailedPokemons);
      setNotFound(false);
    } catch (error) {
      console.error('Erro ao buscar pokémons:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPokemons();
      return;
    }

    try {
      const speciesRes = await axios.get(
        `https://pokeapi.co/api/v2/pokemon-species/${searchTerm.toLowerCase()}`
      );

      const defaultVariety = speciesRes.data.varieties.find((v: any) => v.is_default);
      const pokemonUrl = defaultVariety?.pokemon.url;

      if (!pokemonUrl) {
        throw new Error('Forma padrão não encontrada');
      }

      const res = await axios.get(pokemonUrl);
      const data = res.data;

      const flavor = speciesRes.data.flavor_text_entries.find(
        (entry: any) => entry.language.name === 'en'
      );

      const pokemon: Pokemon = {
        ...data,
        description: flavor?.flavor_text.replace(/\f/g, ' ') || 'No description available.',
      };

      pokemonCache.current.set(pokemon.id, pokemon);
      setPokemons([pokemon]);
      setNotFound(false);
    } catch (error) {
      console.error('Erro ao buscar Pokémon:', error);
      setPokemons([]);
      setNotFound(true);
    }
  };

  const handleNextPage = () => {
    if (offset + limit < TOTAL_POKEMONS) {
      setOffset((prev) => prev + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset >= limit) {
      setOffset((prev) => prev - limit);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="input-group my-4">
          <input
            className="form-control p-2 border"
            placeholder="Digite o nome do Pokémon"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="p-2 btn btn-secondary" onClick={handleSearch}>
            Pesquisar
          </button>
        </div>
      </div>

      <div className="container">
        {notFound ? (
          <p className="text-danger">Pokémon não encontrado.</p>
        ) : (
          <>
            {/* Modo tabela para mobile */}
            <div className="d-md-none">
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>Sprite</th>
                    <th>Nome</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {pokemons.map((pokemon) => (
                    <tr key={pokemon.id}>
                      <td>
                        <img
                          src={pokemon.sprites.front_default}
                          alt={pokemon.name}
                          width={50}
                          height={50}
                        />
                      </td>
                      <td className="text-capitalize">{pokemon.name}</td>
                      <td>
                        {pokemon.types.map((t, index) => (
                          <span
                            key={index}
                            className="type-badge"
                            style={{ backgroundColor: typeColors[t.type.name] || '#777' }}
                          >
                            {t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modo cards para desktop */}
            <div
              className={`row d-none d-md-flex ${
                pokemons.length === 1 ? 'justify-content-center' : ''
              }`}
            >
              {pokemons.map((pokemon) => (
                <div key={pokemon.id} className="col-md-4 mb-4">
                  <div
                    className={`card h-100 shadow-sm card-hover ${
                      hoveredId === pokemon.id ? 'card-hover-hovered' : ''
                    }`}
                    onMouseEnter={() => setHoveredId(pokemon.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={
                      hoveredId === pokemon.id
                        ? {
                            borderImage: `linear-gradient(45deg, ${
                              typeColors[pokemon.types[0].type.name] || '#777'
                            } 50%, ${
                              pokemon.types[1]
                                ? typeColors[pokemon.types[1].type.name] || '#777'
                                : typeColors[pokemon.types[0].type.name] || '#777'
                            } 50%) 1`,
                          }
                        : {}
                    }
                  >
                    <div className="card-body text-center">
                      <img
                        src={pokemon.sprites.front_default}
                        alt={pokemon.name}
                        className="card-img"
                      />
                      <h5 className="card-title text-capitalize">{pokemon.name}</h5>
                      <div className="mb-2">
                        {pokemon.types.map((t, index) => (
                          <span
                            key={index}
                            className="type-badge"
                            style={{ backgroundColor: typeColors[t.type.name] || '#777' }}
                          >
                            {t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}
                          </span>
                        ))}
                      </div>
                      <p className="card-text card-description">{pokemon.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="d-flex justify-content-between align-items-center my-4">
              <button
                className="btn btn-secondary"
                onClick={handlePrevPage}
                disabled={offset === 0}
              >
                ← Anterior
              </button>

              <span className="fw-bold">
                Página {currentPage} de {totalPages}
              </span>

              <button
                className="btn btn-secondary"
                onClick={handleNextPage}
                disabled={offset + limit >= TOTAL_POKEMONS}
              >
                Próximo →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
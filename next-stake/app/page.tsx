"use client";

import { useEffect, useMemo, useState } from "react";
import { connectBalanceSocket } from "@/lib/socket";
import { fetchGames, fetchProfile, startGame, GameItem, ProfileData } from "@/lib/api";
import { ClientType, Game, Gender } from "@/lib/types";

const newsItems = [
    {
        title: "New casino releases",
        desc: "Top slot launches available now.",
    },
    {
        title: "Live drops active",
        desc: "Daily jackpots updated every hour.",
    },
    {
        title: "VIP cashbacks",
        desc: "Claim rewards when you play. ",
    },
];

const categories = ["All", "Popular", "Slots", "Live", "Table", "Drops"];

export default function CasinoHomePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [games, setGames] = useState<Game[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [launching, setLaunching] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredGames = useMemo(() => {
        return games.filter((game) => {
            const matchesSearch = [game.title, game.producer, game.category]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase());
            const matchesCategory = activeCategory === "All" || game.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [games, search, activeCategory]);

    useEffect(() => {
        let active = true;

        async function loadData() {
            try {
                setLoading(true);
                const [userData, gameList] = await Promise.all([fetchProfile(), fetchGames()]);

                if (!active) return;
                setProfile(userData);
                setGames(gameList);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Unable to load casino content. Replace API placeholders with your own endpoints.");
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadData();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const socket = connectBalanceSocket((balance) => {
            setProfile((current) => (current ? { ...current, balance } : current));
        });

        return () => {
            socket.close();
        };
    }, []);

    async function handleLaunch(game: Game) {
        setLaunching(game.id.toString());

        const payload = {
            game_id: 7328,
            currency: 'TRY',
            locale: "en",
            ip: '188.168.3.5',
            client_type: 'desktop' as ClientType,
            url: {
                return_url: 'https://example.com',
                deposit_url: 'https://example.com',
            },
            user: {
                country: 'TK',
                firstname: 'Firstname',
                lastname: 'Lastname',
                user_id: 'user-1',
                nickname: 'username',
                city: 'Ankara',
                date_of_birth: '1995-08-03',
                registred_at: '2024-05-19',
                gender: 'm' as Gender
            }
        }

        try {
            const result = await startGame(payload);
            if (result) {
                window.open(result, "_blank", "noopener,noreferrer");
            }
        } catch (err) {
            console.error(err);
            alert("Unable to launch the game. Check your API integration.");
        } finally {
            setLaunching(null);
        }
    }

    return (
        <main className="page-shell">
            <section className="hero-panel">
                <div className="hero-header">
                    <div>
                        <span className="site-badge">CASINO</span>
                        <h1>Stake Casino</h1>
                        <p>Live games, slots and fast access in one view.</p>
                    </div>
                    <div className="account-card">
                        <div>
                            <span className="account-label">Balance</span>
                            <strong>
                                {profile ? `${profile.currency} ${profile.balance.toFixed(2)}` : "Loading..."}
                            </strong>
                        </div>
                        <div className="account-user">
                            <span>{profile?.username ?? "Guest"}</span>
                        </div>
                    </div>
                </div>

                <div className="hero-body">
                    <div className="hero-copy">
                        <h2>Play your favorite casino games instantly.</h2>
                        <p>
                            Search the live casino, slots, table games and drops without leaving the page.
                            Your balance updates in real time.
                        </p>
                    </div>

                    <div className="hero-news">
                        {newsItems.map((item) => (
                            <article key={item.title} className="news-card">
                                <h3>{item.title}</h3>
                                <p>{item.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="panel-section">
                <div className="panel-top">
                    <div className="search-box">
                        <label className="search-label" htmlFor="casino-search">
                            Search games
                        </label>
                        <input
                            id="casino-search"
                            type="search"
                            placeholder="Search by name, provider, or category"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="category-row">
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={category === activeCategory ? "category-pill active" : "category-pill"}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="games-summary">
                    <span>{filteredGames.length} games available</span>
                    {loading && <span>Loading games...</span>}
                    {error && <span className="error-text">{error}</span>}
                </div>

                <div className="games-grid">
                    {filteredGames.map((game) => (
                        <article key={game.id} className="game-card" onClick={() => handleLaunch(game)}>
                            <img src={`https://thumb.all-ingame.com/iv2/${game.id}.png`} alt={game.title} className="game-thumb" />
                            <div className="game-meta">
                                <div>
                                    <p className="game-title">{game.title}</p>
                                    <p className="game-provider">{game.producer}</p>
                                </div>
                                <span className="game-category">{game.category}</span>
                            </div>
                            <button className="game-action" disabled={launching === game.id.toString()}>
                                {launching === game.id.toString() ? "Launching..." : "Play Now"}
                            </button>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}

import React, { useState, useEffect, useContext } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import { Link } from 'react-router-dom'

import { LocaleContext } from 'Context/LocaleContext'
import Alert from 'Services/Alert'

import ImgBroken from 'Assets/broken.png'
import ImgLoader from 'Assets/loader.gif'
import ImgPokeBallEmplty from 'Assets/pokeball-empty.png'
import ImgPokeBallFilled from 'Assets/pokeball-filled.png'
import Layout from '../Components/Layout'

export default function Home() {
	const localeContext = useContext(LocaleContext)

	const limit = 10
	const [offset, setOffset] = useState(0)
	const [isHasMore, setIsHasMore] = useState(null)
	const [pokemons, setPokemons] = useState({ isLoading: true, isLoadingMore: false, items: [] })
	const [pokemonDetail, setPokemonDetail] = useState({ isLoading: true, items: [] })

	const fetchPokemon = async () => {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
		setPokemons((prevState) => ({ ...prevState, isLoading: true }))

		if (response.status === 200) {
			const data = await response.json().then((response) => {
				setIsHasMore(response.next ? true : false)
				return response.results.map((result, index) => {
					return { ...result, id: offset + index + 1 }
				})
			})
			setPokemons((prevState) => ({ ...prevState, isLoading: false, isLoadingMore: false, items: prevState.items.concat(data) }))
			data.forEach((items) => fetchPokemonDetail(items.id))
		} else {
			console.error()
		}
	}

	const fetchPokemonDetail = async (id) => {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
		if (response.status === 200) {
			const data = await response.json()
			setPokemonDetail((prevState) => ({ ...prevState, items: [...prevState.items, data] }))
		} else {
			console.error()
		}
	}

	const loadMore = async () => {
		if (!pokemons.isLoading && !pokemons.isLoadingMore) {
			setOffset(offset + limit)
		}
	}

	useEffect(() => {
		setPokemons((prevState) => ({ ...prevState, isLoadingMore: true }))
		fetchPokemon({ offset: offset + limit })
		// eslint-disable-next-line
	}, [offset])

	return (
		<Layout>
			<div className='home'>
				<div className='home__title'>Poke Apps</div>
				<InfiniteScroll element='div' className='home__grid container' pageStart={0} loadMore={loadMore} hasMore={isHasMore} loader={<h1>Loading</h1>}>
					{pokemons.items.map((pokemon, index) => {
						return (
							<div className='home__grid__item' key={index}>
								<button
									className='home__grid__item__save'
									style={localeContext.pokedex.items.find((item) => item.id === pokemon.id) ? { backgroundColor: 'red' } : null}
									onClick={() => {
										if (localeContext.pokedex.items.find((item) => item.id === pokemon.id)) {
											localeContext.releasePokemon(pokemon.id)
										} else {
											localeContext.catchPokemon().then((result) => {
												if (result) {
													localeContext.setPokedex((prevState) => ({
														...prevState,
														items: [
															...prevState.items,
															{ id: pokemon.id, name: pokemon.name, spiritImage: pokemonDetail.items.find((item) => item.id === pokemon.id)?.sprites.front_default },
														],
													}))
													Alert.success('Yeaayyy 🔥🔥🔥', 'you got pokemon !!!')
												}
											})
										}
									}}>
									<img src={localeContext.pokedex.items.find((item) => item.id === pokemon.id) ? ImgPokeBallFilled : ImgPokeBallEmplty} alt='poke-ball' />
								</button>
								<Link className='home__grid__item__content' to={`/pokemon/${pokemon.id}`}>
									<img
										className='home__grid__item__content__image'
										src={pokemonDetail.items.find((item) => item.id === pokemon.id)?.sprites.front_default ?? ImgLoader}
										onError={(e) => {
											e.target.onError = null
											e.target.src = ImgBroken
										}}
										alt={pokemon.name}
									/>
									<span>{pokemon?.name}</span>
								</Link>
							</div>
						)
					})}
				</InfiniteScroll>
			</div>
		</Layout>
	)
}

import {Map, List, fromJS} from 'immutable';
import axios from 'axios';
import * as creators from './action_creators';

//util
const getX = state => {
	const direction = state.getIn(['game', 'skier', 'position']);
	switch (direction) {
		case 'right':
			return -1;
			break;
		case 'left':
			return 1;
			break;
		default:
			return 0;
			break;
	}
	return 0;
}

export const INITIAL_STATE = Map({
	game: Map({
		jumps: List(),
		monster: Map(),
		skier: Map({
			state: 'default',
			position: 'down',
			jump: Map({
				asset: 'player_jump.png',
				status: 'jump'
			}),
			dead: Map({
				asset: 'player_dead.png',
				status: 'dead'
			}),
			default: Map({
				asset: 'player_down.png',
				status: 'default'
			})
		}),
		trees: List(),
		stats: Map({
			points: 0,
			moving: false,
			clock: Date.now()
		}),
		settings: Map({
			gravity: -9.8
		})
	})
});

export function addTree(state, pos) {
	return state.updateIn(['game','trees'], oldTrees => {
		return oldTrees.push(fromJS({
			x: pos.randomX,
			y: pos.randomY
		}));
	});
}

export function addJump(state, pos) {
	return state.updateIn(['game','jumps'], oldJumps => {
		return oldJumps.push(fromJS({
			x: pos.randomX,
			y: pos.randomY
		}));
	});
}

export function handleJump(state) {
	return state.setIn(['game', 'skier', 'state'], 'jump');
}

export function handleTree(state) {
	const newState = state.setIn(['game', 'skier', 'state'], 'dead');
	return newState.setIn(['game', 'stats', 'moving'], false);
}

export function moveLeft(state) {
	return state.updateIn(['game', 'skier', 'position'], oldPosition => {
		return 'left';
	});
}

export function moveRight(state) {
	return state.updateIn(['game', 'skier', 'position'], oldPosition => {
		return 'right';
	});
}

export function moveDown(state) {
	return state.updateIn(['game', 'skier', 'position'], oldPosition => {
		return 'down';
	});
}

export function resetSkier(state) {
	const newState = state.setIn(['game', 'skier', 'state'], 'default');
	return newState.setIn(['game', 'stats', 'moving'], true);
}

export function startGame(state) {
	return state.updateIn(['game', 'stats'], oldStats => {
		return oldStats.merge(fromJS({
			moving: !oldStats.get('moving'),
			clock: Date.now()
		}));
	});
}

export function updateTrees(state, gameSize) {
	const xFactor = getX(state);
	const randomX = size => { return Math.floor(Math.random() * size.x); };
	const trees = state.updateIn(['game', 'trees'], oldTrees => {
		return oldTrees.map(tree => {
			let newY = (tree.get('y') < 0) ? gameSize.y + 1 : tree.get('y') - 1;
			let newX = (tree.get('y') < 0) ? randomX(gameSize) : tree.get('x') + xFactor;
			return Map({
				x: newX,
				y: newY
			});
		});
	});
	const jumps = trees.updateIn(['game', 'jumps'], oldJumps => {
		return oldJumps.map(jump => {
			let newY = (jump.get('y') < 0) ? gameSize.y + 1 : jump.get('y') - 1;
			let newX = (jump.get('y') < 0) ? randomX(gameSize) : jump.get('x') + xFactor;
			return Map({
				x: newX,
				y: newY
			});
		});
	});
	return state.merge(jumps);
}
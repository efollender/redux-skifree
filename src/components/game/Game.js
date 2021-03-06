import React, {Component} from 'react';
import {shouldPureComponentUpdate} from 'react-pure-render';
import {List, Map} from 'immutable';
import {connect} from 'react-redux';
import {findDOMNode} from 'react-dom';
import StyleSheet from './Game.styl';
import Skier from './Skier';
import Tree from './Tree';
import Stats from './Stats';
import Jump from './Jump';
import * as actionCreators from '../../action_creators';


window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

const mapStateToProps = state => {
  return {
    skier: state.getIn(['game','skier']),
    trees: state.getIn(['game', 'trees']),
    jumps: state.getIn(['game', 'jumps']),
    stats: state.getIn(['game', 'stats'])
  };
};

class Game extends Component {
  shouldComponentUpdate = shouldPureComponentUpdate;
  constructor(props) {
    super(props);
    this.state = {
      keydown: false
    };
  }
  handleCollision(collision) {
  	switch (collision.type) {
  		case 'jump':
  			return 'handleJump';
  			break;
  		case 'tree':
  			return 'handleTree';
  			break;
  		default:
  			return false;
  	}
  	
  }
  handleKeydown(e) {
    const moving = this.props.stats.toJS().moving;
    const state = this.props.skier.toJS().state;
    let notDead = (state === 'default');
    e.preventDefault();
    switch(e.keyCode) {
      case 37:
        if (!moving && notDead) this.start();
        this.props.moveLeft();
        break;
      case 39:
        if (!moving && notDead) this.start();
        this.props.moveRight();
        break;
      case 40:
        if (notDead) {
          this.setState({keydown: true});
          this.props.moveDown();
        }
        break;
      case 13:
        this.start();
        break;
      default:
        return false;
        break;
    }
  }
  checkCollision(obj, width, height, skier) {
    const x1 = skier.x;
    const w1 = skier.clientWidth;
    const x2 = obj.get('x');
    const w2 = width;
    const y1 = skier.y;
    const h1 = skier.clientHeight;
    const y2 = obj.get('y');
    const h2 = height;
                  //right skier - 1 left of left obj
    let overlap = !(((x1 + w1 - 1) < x2)  ||
                  //right obj - 1 left of left skier
                   ((x2 + w2 - 1) < x1)   ||
                  //bottom skier - 1 above top obj
                   ((y1 + h1 - 1) < y2) ||   
                  // bottom obj - 1 above top skier
                   ((y2 + h2 - 1) < y1));

    return overlap;
  }
  generatePosition() {
    const gameSpace = findDOMNode(this.refs.gameWrapper);
    const randomY = Math.floor(Math.random() * gameSpace.clientHeight);
    const randomX = Math.floor(Math.random() * gameSpace.firstChild.clientWidth);
    return({randomX, randomY});
  }
  start() {
    this.props.startGame();
  }
  end() {

  }
  getAnimation() {
    const stats = this.props.stats.toJS();
    const skier = this.props.skier.toJS();
    const gameSpace = findDOMNode(this.refs.gameWrapper);
    const gameWidth = gameSpace.firstChild.clientWidth;
    const DOMskier = findDOMNode(this.refs.skier).firstChild;
    return requestAnimFrame(() => {
      this.keyFrame = this.getAnimation();
      let action = null;
      let grav = 4;
      if (stats.moving) {
        if (skier.state === 'jump'){
          setTimeout(this.props.resetSkier, 2000);
        }
        const objects = this.props.jumps.concat(this.props.trees);
      	objects.map(object => {
          let width;
          let height;
          if (object.get('type') === 'tree') {
            width = 11;
            height = 20;
          } else if (object.get('type') === 'jump') {
            width = 40;
            height = 9;
          }
      		if (this.checkCollision(object, width, height, DOMskier)) {
      			action = this.handleCollision({type: object.get('type')});
      		}
      	});
        if (this.state.keydown) {
          grav = 8;
        } 
        this.props.updateTrees({
            x: gameWidth, 
            y: gameSpace.clientHeight
          }, grav, action);
      } else if (skier.state === 'dead'){
        setTimeout(this.props.resetSkier, 1000);
      }
    });
  }
  keyUp() {
    this.setState({
      keydown: false
    });
  }
  
  componentDidMount() {
    for (let i=0; i < 20; i++){
      this.props.addTree(this.generatePosition());
    } 
    for (let i=0; i < 3; i++){
      this.props.addJump(this.generatePosition());
    } 
    this.listener = document.addEventListener('keydown', this.handleKeydown.bind(this), false);
    this.keyUp = document.addEventListener('keyup', this.keyUp.bind(this), false);
    this.keyFrame = this.getAnimation();
  }
  componentWillUnmount() {
    document.removeEventListener(this.listener, false);
    document.removeEventListener(this.keyUp, false);
  }
  render() {
    const {trees, skier, jumps, stats} = this.props;
    const moving = stats.toJS().moving;
    return (
      <div className={StyleSheet.wrapper}
        ref="gameWrapper">
        <Skier status={skier} ref="skier" />
        {trees.map((tree, index) => {
          return <Tree key={`tree-${index}`} coords={tree}/>;
        })}
        {jumps.map((jump, index) => {
          return <Jump key={`jump-${index}`} coords={jump}/>;
        })}
        <Stats {...stats.toJS()} />
      </div>
    );
  }
}

export default connect(mapStateToProps, actionCreators)(Game);

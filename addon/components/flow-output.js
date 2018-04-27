import Ember from 'ember';
import layout from '../templates/components/flow-output';

import ConnectorMixin from '../mixins/connector';

/**
* Connector that will be used to display an output pin on a block element.
*/
export default Ember.Component.extend(ConnectorMixin, {
  layout,

  tagName: 'flow-output',

  rerouting: false,

  classNameBindings: ['connected'],

  mouseMove(e){
    let point = this.getCenteredPosition();

    if(this.get('moveStart')){
      this.get('onReroute')(point, this.getCorrectMousePosition(e));
    }
  },

  /**
  * Overrides the default behaviour to prevent the context menu to be
  * opened with the right mouse button
  */
  contextMenu() {
    return false;
  },

  /**
  * Respond to the mouse up event to handle drag and drop of a connection
  * to an input pin or to the container in order to create a new block.
  */
  mouseUp (e){
    e.preventDefault();

    if(e.target.tagName !== "MULTI-SELECTION"){
      return;
    }

    if(this.get('moveStart')){
      this._super(e);

      if(!this.get('model.isConnected')){
        this.get('connectToNewBlock')(this.get('model'), this.getCorrectMousePosition(e));
      }
    }
  },

  getCenteredPosition (){
    //let boundingRectangle = this.element.getBoundingClientRect();
    //let parentOffset = Ember.$(this.element).parents("flow-container").offset();
    //let blockElementBoundingRectangle = Ember.$(this.element).parents("flow-element")[0].getBoundingClientRect();

    //const x = boundingRectangle.left - blockElementBoundingRectangle.left + 10 + boundingRectangle.width / 2;

    return {
      'x': this.get("model.x"),
      'y': this.get("model.y")
    }
  },

});

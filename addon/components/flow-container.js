import Ember from 'ember';
import layout from '../templates/components/flow-container';
import ScrollingMixin from '../mixins/scrolling';
import MovableContainerMixin from '../mixins/movable-container';
import MultiselectionContainerMixin from '../mixins/multiselection-container';
import ZoomContainerMixin from '../mixins/zoom-container';

/**
 * Renders a container component where all flow blocks are displayed.
 * Also all connections are rendered within this container.
 *
 * @see {@link Scrolling}
 * @see {@link MovableContainer}
 * @see {@link MultiselectionContainer}
 * @see {@link ZoomContainer}
 *
 * @module
 * @augments Ember/Component
 */
export default Ember.Component.extend(ScrollingMixin, MovableContainerMixin, MultiselectionContainerMixin, ZoomContainerMixin, {
  layout,

  /**
   * Defines the html tag name that will used by adding the element to the DOM.
   *
   * @constant
   * @type {string}
   */
  tagName: 'flow-container',

  /**
   * Scrolling offset horizontally caused by the user due to scrolling
   *
   * @type {number}
   */
  scrollLeft: 0,

  /**
   * Scrolling offset vertically caused by the user due to scrolling
   *
   * @type {number}
   */
  scrollTop: 0,

  /**
   * The absolute width needed to display all elements.
   *
   * @type {number}
   */
  width : 0,

  /**
   * The absolute height needed to display all elements.
   *
   * @type {number}
   */
  height: 0,

  logicBlockComponent: "flow-element",

  connectionType: "flow-connection",


  /**
   * didInsertElement - Initialize sets the width and height properties
   * to the actual values from the rendered element within the DOM
   *
   * @return {undefined}
   */
  didInsertElement(){
    this._super(...arguments);

    this.set('width', Ember.$(this.element).width());
    this.set('height', Ember.$(this.element).height());
  },



  observerHeight: Ember.observer('blocks.length', function() {
    let maxY = 0;
    this.get('blocks').forEach((block) => {
      if(block.get('y') > maxY){
        maxY = block.get('y');
      }
    })

    this.set('height', maxY + 400);
  }),

  foo: Ember.observer('blocks.@each.childrenWidth', function(){
    const width = this.get('blocks.firstObject.childrenWidth');

    if(!isNaN(width)){

      if(width > this.get('width')){
        this.set("width", width);
      }
    }
  }),


  /**
   * viewbox - Computes a string that is used as a property to describe the
   * viewbox used by the svg element to display connections between nodes.
   *
   * @param  {number} 'scrollLeft' left scrolling offset in case the user scrolls
   * to the left. Only positive integer values are valid.
   * @param  {number} 'scrollTop'  top scrolling offset in case the user scrolls
   * down. Only positive integer values are valid.
   * @param  {number} 'width'      the width of the parent element is used to
   * describe the viewing size horizontally
   * @param  {number} 'height'     the height of the parent element is used to
   * describe the viewing size vertically
   * @return {string}            A string in the form of scrollLeft scrollTop
   * width height e.g. 0 0 1920 1080
   */
  viewbox: Ember.computed('scrollLeft', 'scrollTop', 'width', 'height', function() {
    const scrollLeft = 0; //this.get('scrollLeft');
    const scrollTop = this.get('scrollTop');
    const width = this.get("width"); //Ember.$(this.element).get(0).scrollWidth;
    const height = this.get("height"); //Ember.$(this.element).height();

    return Ember.String.htmlSafe(`${scrollLeft} ${scrollTop} ${width} ${height}`);
  }),


  /**
   * svgSize - Computes the size for the actual DOM element of the svg element.
   * This needs to be computed dynamically each time the parent size changed in
   * order to preserve the correct desciption of the svg content
   *
   * @param  {number} 'width'      the width of the parent element is used to
   * describe the element size horizontally
   * @param  {number} 'height'     the height of the parent element is used to
   * describe the element size vertically
   * @return {string}            A string in the form of width height
   * e.g. 1920 1080
   */
  style: Ember.computed('width', 'height', 'currentZoomLevel', function() {
    const style = Ember.String.htmlSafe(`left: 0px; top: 0px;
      width:${this.get('width')}px;
      height:${this.get("height")}px;
      transform-origin: 0 0;
      transform: scale(${this.currentZoomLevel / 100});
      `);

      return style;
  }),

  /**
  * Handles mouse clicks (left mouse button) on the blank canvas of the container
  * by calling the onContainerMouseClick function. If you didn't define it, the
  * function will do nothing.
  */
  click(event){
    if(event.target.tagName === "MULTI-SELECTION"){
      const onContainerMouseClick = this.onContainerMouseClick;

      if(onContainerMouseClick){
        onContainerMouseClick();
      }
    }
  },



  actions: {

    /**
     * reroute - Sets the showReconnector property to true to show a
     * connection to visualize the reconnection process. Also start and end
     * coordinates for the connection are set so that the connection is
     * displayed properly
     *
     * @param  {Point} start coordinates of the start point for the reconnection
     * connection. This is usually an output of a block
     * @param  {Point} end   coordinates of the end point for the reconnection
     * connection. This is usually an arbitrary point not related to any block
     * @param {Output} output the output pin of the element where the reroute
     * connection was dragged initially
     */
    onReroutePin(start, end, output){
      this.set('showReconnector', true);
      this.set('rerouteInputPin', output);
      this.set('start', start);
      this.set('end', end);
    },


    /**
     * Use this function to add a block to the model. Overwrite this function
     * to customize the behaviour.
     *
     * @param {Output} output - the outgoing pin where the action was initialized
     * @param {Point} point - the position where the mouse button was released and
     * the new block should be inserted
     */
    onConnectToNewBlock(output, point){
      const connectToNewBlock = this.get('onConnectToNewBlock');
      const connected = output.get('isConnected');

      if(connectToNewBlock && !connected){
        this.set('showReconnector', false);

        connectToNewBlock(output, point);
      }else{
        this.set('showReconnector', false);
      }
    },

    onInputPinMouseUp(input){

      //if(!input.isConnected){
        const onReconnectingPins = this.onReconnectingPins;

        if(onReconnectingPins){
          onReconnectingPins(this.rerouteInputPin, input);
          this.set('showReconnector', false);
        }
      //}
    },

    /**
     * deletes the block from the container and all related connections
     * to this element.
     *
     * @param {FlowElement} block - the block that the user want to remove
     * from the model
     */
    onDeleteBlock(block){
      const deleteBlock = this.onDeleteBlock;

      if(deleteBlock){
        deleteBlock(block);
      }
    },


    /**
     * action will triggered if the user reroutes a connection to the container
     * and not to a new connection point, a new block will be added to the
     * container. Specify the method that modifies model and adds the new block
     * in the route class or controller.
     *
     * @param {Output} output - end of the connection that is connected to the
     * rerouting connection.
     * @param {Point} point - the coordinates where the user released the mouse
     * or touch to create a new connected block to the connection
     */
    cancelReroute(output, point){
      this.set('showReconnector', false);

      this.get('onAddNewElement')(output, point);
    },


    onElementEdit(id){
      const onElementEdit = this.get('onElementEdit');

      onElementEdit(id);
    }
  },
});

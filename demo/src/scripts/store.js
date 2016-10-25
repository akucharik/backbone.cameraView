'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import { createStore } from 'redux';
import reducers        from './reducers';

let store = createStore(reducers.app);

export default store;
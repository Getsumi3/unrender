/**
 * Gives an index of a node under mouse coordinates
 */
const eventify = require('ngraph.events');
const THREE = require('three');
const createOctree = require('yaot');

module.exports = createHitTest;

function createHitTest(particleView, domElement, inputController) {
    if (!particleView) {
        throw new Error('hit-test cannot work without particle view');
    }

    let octTree;
    let lastIntersected;

    const raycaster = new THREE.Raycaster();

    domElement = domElement || document.body;

    // we will store mouse coordinates here to process on next RAF event (`update()` method)
    const mouse = {
        x: 0,
        y: 0
    };

    // ray tracing is very expensive. We will do it only when user moves mouse
    // By default there should be no interaction
    let noInteraction = true;
    let interactionRestCallbackId;
    const waitForInteractionMS = 100; // we will keep listening 300 ms after user moved mouse

    let drag = false; // a checker to distinguish drag event from click event

    // store DOM coordinates as well, to let clients know where mouse is
    const domMouse = {
        down: false,
        x: 0,
        y: 0,
        indexes: undefined,
        ray: undefined
    };
    let singleClickHandler;

    domElement.addEventListener('mousemove', onMouseMove, false);
    domElement.addEventListener('mousedown', onMouseDown, false);
    domElement.addEventListener('mouseup', onMouseUp, false);
    domElement.addEventListener('touchstart', onTouchStart, false);
    domElement.addEventListener('touchend', onTouchEnd, false);
    //disable context menu while focused on scene
    domElement.addEventListener('contextmenu', preventContextMenu, false);

    const api = {
        /**
         * This should be called from RAF. Initiates process of hit test detection
         */
        update: update,

        /**
         * Removes all listeners
         */
        destroy: destroy
    };

    // let us publish events
    eventify(api);
    return api;

    function destroy() {
        domElement.removeEventListener('mousemove', onMouseMove, false);
        domElement.removeEventListener('mousedown', onMouseDown, false);
        domElement.removeEventListener('mouseup', onMouseUp, false);
        domElement.removeEventListener('touchstart', onTouchStart, false);
        domElement.removeEventListener('touchend', onTouchEnd, false);
        domElement.removeEventListener('contextmenu', preventContextMenu, false);
        api.off(); // destroy all notifications to subscribers
    }

    function onMouseUp(e) {
        if (e.which === 1) {
            if(!drag) {
                domMouse.down = false;
                singleClickHandler = setTimeout(function () {
                    api.fire('click', domMouse);
                    singleClickHandler = undefined;
                }, 300);
            }
        }
    }

    function onMouseDown(e) {
        if (e.which === 1) {
            domMouse.down = true;
            drag = false;
            if (singleClickHandler) {
                // If we were able to get here without clearing single click handler,
                // then we are dealing with double click.

                // No need to fire single click event anymore:
                clearTimeout(singleClickHandler);
                singleClickHandler = null;

                // fire double click instead:
                api.fire('dblclick', domMouse);
            }
            // todo: investigate this code. it behaves somewhat strange when firing click event
            // } else {
            //     // Wait some time before firing event. It can be a double click...
            //     singleClickHandler = setTimeout(function () {
            //         api.fire('click', domMouse);
            //         singleClickHandler = undefined;
            //     }, 300);
            // }
        }
    }

    function onTouchStart(e) {
        if (!e.touches || e.touches.length !== 1) {
            return;
        }

        setMouseCoordinates(e.touches[0]);
    }

    function onTouchEnd(e) {
        if (e.touches && e.touches.length === 1) {
            setMouseCoordinates(e.touches[0]);
        }
        setTimeout(function () {
            api.fire('click', domMouse);
        }, 0);
    }

    function onMouseMove(e) {
        if(e.which === 1) {
            drag = true;
        }
        setMouseCoordinates(e);
    }

    function setMouseCoordinates(e) {
        mouse.x = (e.clientX / domElement.clientWidth) * 2 - 1;
        mouse.y = -(e.clientY / domElement.clientHeight) * 2 + 1;

        domMouse.x = e.clientX;
        domMouse.y = e.clientY;

        noInteraction = false;
        scheduleInteractionReset();
    }

    function scheduleInteractionReset() {
        if (interactionRestCallbackId) clearTimeout(interactionRestCallbackId);
        interactionRestCallbackId = setTimeout(resetNoInteraction, waitForInteractionMS);
    }

    function resetNoInteraction() {
        // since use haven't moved mouse in a while, we stop processing events:
        noInteraction = true;
    }

    function update(scene, camera) {
        // We need to stop processing any events until user moves mouse.
        if (noInteraction) return;

        // We can provide much faster interface if we not check hit tests
        // when user moves around:
        if (inputController.isMoving()) return;

        const pointCloud = particleView.getPoints();
        if (!pointCloud) return;

        raycaster.setFromCamera(mouse, camera);
        domMouse.indexes = lastIntersected = intersect(pointCloud.geometry);
        domMouse.ray = raycaster.ray;

        api.fire('over', domMouse);
    }

    function intersect(geometry) {
        const attributes = geometry.attributes;
        const positions = attributes.position.array;
        if (!octTree) {
            // todo: would be nice to have this loaded async.
            octTree = createOctree();
            octTree.initAsync(positions, notifyThreeProgress, notifyTreeReady);
        }

        const ray = raycaster.ray;
        const rayOrigin = ray.origin;
        const minDistance = 0;
        const maxDistance = 5000; // limit raycast distance to prevent unwanted intersections far away
        return octTree.intersectRay(rayOrigin, ray.direction, minDistance, maxDistance);

    }

    function notifyTreeReady(tree) {
        api.fire('hitTestReady', tree);
    }

    function notifyThreeProgress(progress) {
        api.fire('hitTestProgress', progress);
    }

    function preventContextMenu(e) {
        e.preventDefault();
    }
}

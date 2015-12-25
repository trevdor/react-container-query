import createContainerQueryMixin from '../src';
import { requestAnimationFrame, cancelAnimationFrame } from '../src/raf';

describe('createContainerQueryMixin', function () {

  function getMixin(maskMethods) {
    return createContainerQueryMixin({
      mobile: {maxWidth: 399},
      desktop: {minWidth: 400}
    });
  }

  describe('defineContainer', function () {

    it('assigns _containerElement to ctx', function () {
      const subjectMethod = getMixin().defineContainer;
      const ctx = {};
      subjectMethod.call(ctx, 'element');
      expect(ctx._containerElement).toEqual('element');
    });

  });

  describe('componentDidMount', function () {

    let subjectMethod;
    let ctx;
    let element;

    beforeEach(function () {
      subjectMethod = getMixin().componentDidMount;
      element = document.createElement('div');
      element.style.width = '200px';
      element.style.height = '200px';
      document.body.appendChild(element);
      ctx = {
        _containerElement: element,
        _updateAttributes: jasmine.createSpy('_updateAttributes')
      };
    });

    afterEach(function () {
      document.body.removeChild(element);
    });

    it('checks element size', function () {
      subjectMethod.call(ctx);

      expect(ctx._containerQuerySelectorMap).toEqual({});
      expect(ctx._size).toEqual({width: 200, height: 200});
      expect(ctx._rafId).not.toBeNull();
      expect(ctx._updateAttributes.calls.count()).toEqual(1);

      cancelAnimationFrame(ctx._rafId);
    });

    it('checks element size periodically', function (done) {
      subjectMethod.call(ctx);

      setTimeout(() => {
        element.style.width = '300px';
        element.style.height = '300px';

        setTimeout(() => {
          expect(ctx._updateAttributes.calls.count()).toBeGreaterThan(1);
          cancelAnimationFrame(ctx._rafId);
          done();
        }, 100);
      }, 100);

    });

  });

  describe('componentWillUnmount', function () {

    it('cancels pending animation frame request', function (done) {
      const subjectMethod = getMixin().componentWillUnmount;
      const ctx = {
        _containerElement: {},
        _rafId: requestAnimationFrame(() => {
          done.fail('should not reach here');
        })
      };

      subjectMethod.call(ctx);

      setTimeout(() => {
        expect(ctx._rafId).toBeNull();
        expect(ctx._containerElement).toBeNull();
        done();
      }, 200);
    });

  });

  describe('_updateAttributes', function () {

    let subjectMethod;
    let ctx;

    beforeEach(function () {
      subjectMethod = getMixin()._updateAttributes;
      ctx = {
        _size: {
          width: 300,
          height: 300
        },
        _containerElement: document.createElement('div'),
        _containerQuerySelectorMap: {}
      };
    });

    it('add attribute to container element', function () {
      subjectMethod.call(ctx);

      expect(ctx._containerQuerySelectorMap).toEqual({
        mobile: true,
        desktop: false
      });
      expect(ctx._containerElement.hasAttribute('mobile')).toEqual(true);
      expect(ctx._containerElement.hasAttribute('desktop')).toEqual(false);
    });

    it('update container element attributes', function () {
      ctx._containerElement.setAttribute('desktop', '');

      subjectMethod.call(ctx);

      expect(ctx._containerQuerySelectorMap).toEqual({
        mobile: true,
        desktop: false
      });
      expect(ctx._containerElement.hasAttribute('mobile')).toEqual(true);
      expect(ctx._containerElement.hasAttribute('desktop')).toEqual(false);
    });

    it('does not change any thing if selectorMap is the same', function () {
      ctx._containerElement.setAttribute('desktop', '');
      ctx._containerQuerySelectorMap = {
        mobile: true,
        desktop: false
      };

      subjectMethod.call(ctx);

      expect(ctx._containerQuerySelectorMap).toEqual({
        mobile: true,
        desktop: false
      });
      expect(ctx._containerElement.hasAttribute('mobile')).toEqual(false);
      expect(ctx._containerElement.hasAttribute('desktop')).toEqual(true);
    });

  });

});
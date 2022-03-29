import './confirmDialog.less';

import { getAfFieldId, promise } from './generic';
import DOMPurify from 'dompurify';

const sampleDialog = `
<div class="dc-modal-cover">
  <div class="dc-modal">
    <div class="dc-modal-header">
      <h2 tabindex="0">Modal Header</h2>
      <a href="#" class="cancel">X</a>
    </div>
    <div class="dc-modal-body">
      <p>Are you sure to delete?</p>
    </div>
    <div class="dc-modal-footer">
      <div>
        <button class="cancel yesDel">Yes</button>
        <button class="cancel noDel">No</button>
      </div>
    </div>
  </div>
</div>
`;

// On aem delete button init
// In case of assistive technology (like screen readers) users, or keyboard users, trapping focus is a must.
// assumption: .dc-modal-cover, .cancel, .yesDel
export function confirmDialog(fld, dialogTpl = sampleDialog) {
  let cleanTpl = DOMPurify.sanitize(dialogTpl, { FORCE_BODY: true });
  let fldId = getAfFieldId(fld);
  $(`#${fldId}`).after(cleanTpl);

  promise(`#${fldId} + .dc-modal-cover`).then(() => {
    let modal = $(`#${fldId} + .dc-modal-cover`).first();
    let origButton = $(`#${fldId} button`).first();

    // deprecated: When the user clicks anywhere outside of the modal, close it
    //$(window).click(windowClick);
    //$(window).unbind('click', windowClick);
    let windowClick = (e) => {
      if ($(e.target).hasClass('dc-modal-cover')) {
        modal.css('display', 'none');
        $(window).unbind('click', windowClick);
      }
    };

    // keep original handlers
    let origHandlers = [];
    $.each($._data($(`#${fldId} button`)[0], 'events'), function (i, event) {
      if (i === 'click') {
        $.each(event, function (j, h) {
          origHandlers.push(h.handler);
        });
        origButton.off('click');
      }
    });

    // click to show modal
    origButton.click((e, obj) => {
      e.stopPropagation();
      e.preventDefault();
      modal.css('display', 'block');
      $(`#${fldId} + .dc-modal-cover h2`).first().focus();
      $('body').css('overflow', 'hidden');
    });

    // hide modal, and call origHandlers
    modal.find('.cancel').click((e) => {
      modal.css('display', 'none');
      $('body').css('overflow', '');
      if ($(e.target).hasClass('yesDel')) {
        origHandlers.forEach((fn) => {
          fn(e);
        });
      }

      // recover the focus
      origButton.focus();
    });

    // trap focus
    $(`#${fldId} + .dc-modal-cover`).on(
      'transitionend webkitTransitionEnd mozTransitionEnd oTransitionEnd',
      function (event) {
        // Do stuff after transition done
        if (
          !document
            .querySelector(`#${fldId} + .dc-modal-cover`)
            .contains(document.activeElement)
        ) {
          event.stopPropagation();
          event.preventDefault();
          $(`#${fldId} + .dc-modal-cover h2`).first().focus();
        }
      }
    );
  });
}

"use strict";

// use method mode
format.extend(String.prototype, {})

function create_html_element(tag, attributes)
{
  var element = document.createElement(tag);
  if (attributes === undefined)
    return element;
  for (let attribute in attributes)
    if (attributes.hasOwnProperty(attribute))
      if (attribute == 'text')
        element.textContent = attributes[attribute];
      else if (attribute == 'children' || attributes == 'events' || attributes == 'style')
        ;
      else
        element.setAttribute(attribute, attributes[attribute]);
  if (attributes.hasOwnProperty('children'))
    for (let i = 0; i < attributes.children.length; i++)
    {
      let child = attributes.children[i];
      if (typeof(child) === 'string')
        child = document.createTextNode(child);
      element.appendChild(child);
    }
  if (attributes.hasOwnProperty('events'))
  {
    let events = attributes.events;
    for (let e in events)
      if (events.hasOwnProperty(e))
        element.addEventListener(e, events[e]);
  }
  if (attributes.hasOwnProperty('style'))
  {
    let style = attributes.style;
    for (let key in style)
      if (style.hasOwnProperty(key))
        element.style[key] = style[key];
  }
  return element;
}

function create_svg_element(tag, attributes)
{
  var element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attributes === undefined)
    return element;
  for (let attribute in attributes)
    if (attributes.hasOwnProperty(attribute))
      if (attribute.startsWith('xlink:'))
        element.setAttributeNS('http://www.w3.org/1999/xlink', attribute.substring(6), attributes[attribute]);
      else if (attribute == 'text')
        element.textContent = attributes[attribute];
      else if (attribute == 'children' || attribute == 'events' || attribute == 'style')
        ;
      else
        element.setAttribute(attribute, attributes[attribute]);
  if (attributes.hasOwnProperty('children'))
    for (let i = 0; i < attributes.children.length; i++)
      element.appendChild(attributes.children[i]);
  if (attributes.hasOwnProperty('events'))
  {
    let events = attributes.events;
    for (let e in events)
      if (events.hasOwnProperty(e))
        element.addEventListener(e, events[e]);
  }
  if (attributes.hasOwnProperty('style'))
  {
    let style = attributes.style;
    for (let key in style)
      if (style.hasOwnProperty(key))
        element.style[key] = style[key];
  }
  return element;
}

function create_vertically_centered_html_element(inner_tag, inner_attributes, outer_attributes)
{
  if (outer_attributes === undefined)
    outer_attributes = {};
  let inner = create_html_element(inner_tag, inner_attributes);
  inner.classList.add('vertically-centered-content-3');
  outer_attributes.children = [
    create_html_element(
      'div',
      {
        'class': 'vertically-centered-content-2',
      }),
    inner,
  ];
  let outer = create_html_element(
    'div',
    outer_attributes);
  outer.classList.add('vertically-centered-content-1');
  return {outer: outer, inner: inner};
}

function floormod(a, b)
{
  return a-Math.floor(a/b)*b;
}

function round_multiple(a, b)
{
  return Math.round(a/b)*b;
}

function angle_difference(a, b)
{
  let d = floormod(a-b, 2*Math.PI);
  if (d > Math.PI)
    return d-2*Math.PI;
  else
    return d;
}

function angle_distance(a, b)
{
  let d = floormod(b-a, 2*Math.PI);
  return Math.min(d, 2*Math.PI-d);
}

function round_towards_zero(x)
{
  if (x < 0)
    return Math.ceil(x);
  else
    return Math.floor(x);
}

class ClockWidget
{
  constructor(kwargs)
  {
    this._adjustable = false;
    this._delta = {hour: 60, minute: 1};
    this._angle_delta = {hour: 2*Math.PI/12/5, minute: 2*Math.PI/12/5};
    if (kwargs === undefined)
      kwargs = {};
    if (kwargs.hasOwnProperty('adjustable'))
      this._adjustable = kwargs.adjustable;
    if (kwargs.hasOwnProperty('minute_delta'))
      this._delta.minute = kwargs.minute_delta;
    if (kwargs.hasOwnProperty('speedup'))
      this._angle_delta = {
        hour: 2*Math.PI/12/kwargs.speedup,
        minute: 2*Math.PI/12/kwargs.speedup,
      };

    this._time_in_minutes = 0;

    this._element = create_svg_element(
      'svg',
      {
        'class': 'clock',
        version: '1.1',
        viewBox: '-100 -100 200 200',
        xmlns: 'http://www.w3.org/2000/xmlns/',
      });
    if (this._adjustable)
      this._element.classList.add('adjustable');
    // TODO: CHECK FOLLOWING LINE
    this._element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // add clock border
    this._element.appendChild(create_svg_element(
      'circle', {
        cx: 0, cy: 0, r: 98,
        fill: 'none',
        'stroke-width': 4,
        }));

    // add clock ticks and labels
    for (let i = 0; i < 60; i++)
    {
      let s = 1;
      if (i % 5 == 0)
      {
        s = 2;
        let label = 12;
        if (i > 0)
          label = Math.floor(i/5);
        this._element.appendChild(create_svg_element(
          'text',
          {
            'class': 'label',
            text: label.toString(),
            x: 0,
            y: -70,
            transform: 'rotate({0}) rotate(-{0} 0 -70)'.format(i*6),
          }));
      }
      this._element.appendChild(create_svg_element(
        'line',
        {
          x1: 0,
          x2: 0,
          y1: -94,
          y2: -94+6*s,
          fill: 'none',
          'stroke-width': 2*s,
          transform: 'rotate({})'.format(i*6),
        }));
    }

    this._el_hand = {};
    for (let s of [{hand: 'minute', l: 60, r: 5}, {hand: 'hour', l: 40, r: 3}])
    {
      this._el_hand[s.hand] = create_svg_element(
        'g',
        {
          'class': '{}-hand'.format(s.hand),
          children: [
            create_svg_element('line', {x1: 0, x2: 0, y1: 0, y2: -s.l, fill: 'none', 'stroke-width': 4}),
            create_svg_element('circle', {cx: 0, cy: 0, r: s.r, stroke: 'none'}),
          ],
        });
      this._element.appendChild(this._el_hand[s.hand]);
    }

    if (this._adjustable === true)
    {
      this._button_angle = {};
      for (let s of [{hand: 'hour', s: -1}, {hand: 'minute', s: 1}])
      {
        let w = 50;
        let a = 4;
        let R = Math.sqrt(Math.pow(100-w, 2)+Math.pow(100-2*a, 2));
        let z = 50+R/Math.sqrt(2)/2;
        let el = create_svg_element(
          'g',
          {
            'class': '{}-button'.format(s.hand),
            children: [
              create_svg_element(
                'path',
                {
                  d: 'M{a},{h} A{r},{r} 0 0,{k} {g},{b} L{i},{b} A{r},{r} 0 0,{k} {c},{d} A{R},{R} 0 0,{K} {e},{f} A{r},{r} 0 0,{k} {a},{j} Z'.format({
                    a: s.s*100,
                    b: -100,
                    g: s.s*(100-a),
                    h: -100+a,
                    c: s.s*(100-w),
                    d: -100+2*a,
                    e: s.s*(100-2*a),
                    f: -100+w,
                    i: s.s*(100-w+2),
                    j: -100+w-2,
                    k: (s.s < 0 ? 1 : 0),
                    K: (s.s < 0 ? 0 : 1),
                    R: R,
                    r: a,
                  }),
                  stroke: 'none',
                }),
              create_svg_element(
                'text',
                {
                  text: {hour: 'U', minute: 'M'}[s.hand],
                  x: s.s*z,
                  y: -z,
                }),
            ],
          });
        this._element.appendChild(el);
        el.addEventListener('touchstart', this.set_adjust.bind(this, s.hand));
        el.addEventListener('mousedown', this.set_adjust_mouse.bind(this, s.hand));
      }
      this._element.classList.add('set-hour');
      this._adjust_hand = 'hour';

      this._mouse_down = false;
      for (let e of ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'mouseleave', 'mousemove'])
        this._element.addEventListener(e, this['_clock_'+e].bind(this));
      this._element.addEventListener('selectstart', this._stop_event);
    }
  }

  get time()
  {
    return {
      minute: floormod(this._time_in_minutes, 60),
      hour: floormod(Math.floor(this._time_in_minutes/60), 12),
    };
  }

  set time(t)
  {
    if (typeof(t) !== 'number')
    {
      let current = this.time;
      if (t.hasOwnProperty('hour'))
        current.hour = t.hour;
      if (t.hasOwnProperty('minute'))
        current.minute = t.minute;
      t = current.hour*60+current.minute;
    }
    this._time_in_minutes = round_multiple(floormod(t, 60*12), this._delta.minute);
    for (let hand of ['hour', 'minute'])
      this._el_hand[hand].setAttribute('transform',
        'rotate({})'.format(this._hand_angles_degrees[hand]));
  }

  get _hand_angles()
  {
    return {
      'minute': this.time.minute*Math.PI/30,
      'hour': (this.time.hour+this.time.minute/60)*Math.PI/6,
    };
  }

  get _hand_angles_degrees()
  {
    return {
      'minute': this.time.minute*6,
      'hour': this.time.hour*30+this.time.minute/2,
    };
  }

  //addEventListener(...)
  //{
  //  // forward to this._element.addEventListener
  //}

  _calc_local_coordinate(global_coord)
  {
    let bbox = this._element.getBoundingClientRect();
    let viewbox = this._element.viewBox.baseVal;
    return {
      x: (global_coord.clientX-bbox.left)*viewbox.width/bbox.width+viewbox.x,
      y: (global_coord.clientY-bbox.top)*viewbox.height/bbox.height+viewbox.y,
    }
  }

  _calc_angle(global_coord)
  {
    let local_coord = this._calc_local_coordinate(global_coord);
    return Math.atan2(local_coord.x, -local_coord.y);
  }

  _clock_touchstart(e)
  {
    this._adjust_angle = this._calc_angle(e.targetTouches[0]);
    e.stopPropagation();
    e.preventDefault();
  }

  _clock_touchmove(e)
  {
    let new_angle = this._calc_angle(e.targetTouches[0]);
    let delta = round_towards_zero(
      angle_difference(new_angle, this._adjust_angle)
      /this._angle_delta[this._adjust_hand]);
    this._adjust_angle = floormod(
      this._adjust_angle+delta*this._angle_delta[this._adjust_hand], 2*Math.PI);
    if (delta != 0)
      this.time = this._time_in_minutes + delta*this._delta[this._adjust_hand];
    e.stopPropagation();
    e.preventDefault();
  }

  _clock_touchend(e)
  {
    e.stopPropagation();
    e.preventDefault();
    this._element.dispatchEvent(new Event('user-changed-clock'));
  }

  _clock_mousedown(e)
  {
    this._adjust_angle = this._calc_angle(e);
    this._mouse_down = true;
    e.stopPropagation();
    e.preventDefault();
  }

  _clock_mouseup(e)
  {
    this._mouse_down = false;
    e.stopPropagation();
    e.preventDefault();
  }

  _clock_mouseleave(e)
  {
    this._mouse_down = false;
    e.stopPropagation();
    e.preventDefault();
  }

  _clock_mousemove(e)
  {
    if (this._mouse_down)
    {
      let new_angle = this._calc_angle(e);
      let delta = round_towards_zero(
        angle_difference(new_angle, this._adjust_angle)
        /this._angle_delta[this._adjust_hand]);
      this._adjust_angle = floormod(
        this._adjust_angle+delta*this._angle_delta[this._adjust_hand], 2*Math.PI);
      if (delta != 0)
        this.time = this._time_in_minutes + delta*this._delta[this._adjust_hand];
    }
    e.stopPropagation();
    e.preventDefault();
  }

  _stop_event(e)
  {
    e.stopPropagation();
    e.preventDefault();
  }

  set_adjust(hand)
  {
    if (hand === 'minute')
    {
      this._element.classList.remove('set-hour');
      this._element.classList.add('set-minute');
      this._adjust_hand = 'minute';
    }
    else
    {
      this._element.classList.remove('set-minute');
      this._element.classList.add('set-hour');
      this._adjust_hand = 'hour';
    }
  }

  set_adjust_mouse(hand, e)
  {
    this.set_adjust(hand);
    e.stopPropagation();
    e.preventDefault();
  }
}

class ClockTest
{
  constructor(kwargs)
  {
    this._minute_delta = 1;
    if (kwargs === undefined)
      kwargs = {};
    if (kwargs.hasOwnProperty('minute_delta'))
      this._minute_delta = kwargs.minute_delta;
    this._n_questions = kwargs.n_questions;
    this._question_number = 0;

    this._n_steps_minute = Math.round(60/this._minute_delta);

    this._element = document.body;

    this._top_bar = create_html_element('div', {'class': 'top-bar'});
    this._question = create_html_element('div', {'class': 'question'});
    kwargs.adjustable = true;
    this._clock = new ClockWidget(kwargs);
    this._main = create_vertically_centered_html_element(
      'div',
      {
        children: [
          this._question,
          create_html_element('div', {children: [this._clock._element]}),
          create_html_element('div', {children: [
            create_html_element('div', {'class': 'button', text: 'sla over', events: {click: this.skip_question.bind(this), touchstart: this.skip_question.bind(this)}}),
            create_html_element('div', {'class': 'button', text: 'controleer', events: {click: this.test_answer.bind(this), touchstart: this.test_answer.bind(this)}}),
          ]}),
        ],
      },
      {}
    );

    this._top_bar_text = create_html_element('p');
    this._top_bar.appendChild(this._top_bar_text);

    this._element.appendChild(this._top_bar);
    this._element.appendChild(this._main.outer);

    this._element.addEventListener('selectstart', this.stop_event);
    this._element.addEventListener('touchstart', this.stop_event);

//  this._clock._element.addEventListener('user-changed-clock', this.test_answer.bind(this));

    this.reset();
  }

  skip_question()
  {
    let extra = create_html_element(
      'div',
      {
        'class': 'button invisible',
        text: 'verder',
      });
    let call_next = undefined;
    let fadeout = true;
    if (this._question_number == this._n_questions)
    {
      call_next = this.add_overlay_stats.bind(this);
      fadeout = false;
    }
    else
      call_next = this.next_question.bind(this);
    let clock = new ClockWidget({adjustable: false});
    clock.time = this._goal;
    let el = create_vertically_centered_html_element(
      'div',
      {
        children: [
          create_html_element('p', {text: this._question.textContent}),
          create_html_element('p', {text: 'Het goede antwoord is:'}),
          create_html_element('div', {children: [clock._element]}),
          extra,
        ],
      },
      {'class': 'overlay'}
    );
    this._element.appendChild(el.outer);
    el.outer.style.opacity = 0;
    window.getComputedStyle(el.outer).opacity;
    el.outer.style.opacity = 1;
    let call = this.call_if_visible.bind(this, extra, this.remove_overlay.bind(this, el.outer, call_next, fadeout));
    extra.addEventListener('click', call);
    extra.addEventListener('touchstart', call);
    window.setTimeout(this.reveal_extra.bind(this, extra), 3000);
  }

  add_overlay_wrong()
  {
    let el = create_vertically_centered_html_element(
      'div',
      {
        children: [
          create_html_element('p', {'class': 'big', text: 'FOUT!'}),
        ],
      },
      {'class': 'overlay wrong-answer'}
    );
    this._element.appendChild(el.outer);
    el.outer.style.opacity = 0;
    window.getComputedStyle(el.outer).opacity;
    el.outer.style.opacity = 1;
    window.setTimeout(this.remove_overlay.bind(this, el.outer), 2000);
  }

  add_overlay_good()
  {
    let extra = create_html_element(
      'div',
      {
        'class': 'button invisible',
        text: 'verder',
      });
    let call_next = undefined;
    let fadeout = true;
    if (this._question_number == this._n_questions)
    {
      call_next = this.add_overlay_stats.bind(this);
      fadeout = false;
    }
    else
      call_next = this.next_question.bind(this);
    let el = create_vertically_centered_html_element(
      'div',
      {
        children: [
          create_html_element('p', {'class': 'big', text: 'GOED!'}),
          extra,
        ],
      },
      {'class': 'overlay good-answer'}
    );
    this._element.appendChild(el.outer);
    el.outer.style.opacity = 0;
    window.getComputedStyle(el.outer).opacity;
    el.outer.style.opacity = 1;
    let call = this.call_if_visible.bind(this, extra, this.remove_overlay.bind(this, el.outer, call_next, fadeout));
    extra.addEventListener('click', call);
    extra.addEventListener('touchstart', call);
    window.setTimeout(this.reveal_extra.bind(this, extra), 1000);
  }

  add_overlay_stats()
  {
    let extra = create_html_element(
      'div',
      {
        'class': 'button invisible',
        text: 'begin opnieuw',
      });
    let children = [
      create_html_element('p', {'class': 'big', text: 'GOED!'}),
    ];
    let el = create_vertically_centered_html_element(
      'div',
      {
        children: [
          create_html_element('p', {text: 'Je bent klaar!'}),
          create_html_element('p', {text: 'Je hebt {} van de {} vragen goed beantwoord.'.format(this._n_questions_good, this._n_questions)}),
          extra
        ],
      },
      {'class': 'overlay'}
    );
    this._element.appendChild(el.outer);
    el.outer.style.opacity = 0;
    window.getComputedStyle(el.outer).opacity;
    el.outer.style.opacity = 1;
    let call = this.call_if_visible.bind(this, extra, this.remove_overlay.bind(this, el.outer, this.reset.bind(this)));
    extra.addEventListener('click', call);
    extra.addEventListener('touchstart', call);
    window.setTimeout(this.reveal_extra.bind(this, extra), 1000);
  }

  call_if_visible(button, call, e)
  {
    if (!button.classList.contains('invisible'))
      call(e);
    else
    {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  reveal_extra(extra)
  {
    extra.classList.remove('invisible');
  }

  remove_overlay(overlay, call_next, fadeout)
  {
    if (fadeout === undefined)
      fadeout = true;
    window.setTimeout(this.remove_overlay_part2.bind(this, overlay), 200);
    if (fadeout)
      overlay.style.opacity = 0;
    if (call_next !== undefined)
      call_next();
  }

  remove_overlay_part2(overlay)
  {
    this._element.removeChild(overlay);
  }

  reset()
  {
    this._question_number = 0;
    this._n_questions_good = 0;
    this._clock.time = 0;
    this.next_question();
  }

  next_question()
  {
    this._clock.set_adjust('hour');
    this._question_number += 1;
    this._top_bar_text.textContent = 'vraag {} van {}'.format(this._question_number, this._n_questions);
    for (var i = 0; i < 100; i++)
    {
      this._goal = {
        hour: Math.floor(Math.random() * 12)%12,
        minute: (Math.floor(Math.random() * this._n_steps_minute) % this._n_steps_minute ) * this._minute_delta,
      };
      if (this._goal.hour != this._clock.time.hour && this._goal.minute != this._clock.time.minute)
        break;
    }
    this._question.innerHTML = '';
    this._question.appendChild(create_html_element('p', {text: 'Zet de klok op ' + this.format_time_sentence(this._goal) + '.'}));
  }

  test_answer()
  {
    if ((this._goal.hour-this._clock.time.hour)%12 == 0 && (this._goal.minute-this._clock.time.minute)%60 == 0)
    {
      this.add_overlay_good();
      this._n_questions_good += 1;
    }
    else
      this.add_overlay_wrong();
  }

  format_time_digital(time)
  {
    let hour = time.hour;
    if (hour == 0)
      hour = 12;
    return '{}{}:{}{}'.format(
      (hour < 10 ? '0' : ''),
      hour,
      (minute < 10 ? '0' : ''));
  }

  written_number(n)
  {
    return ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien'][n];
  }

  format_time_sentence(time)
  {
    let hour = time.hour;
    if (hour == 0)
      hour = 12;
    if (time.minute == 0)
      return this.written_number(hour) + ' uur';
    else if (time.minute < 15)
      return this.written_number(time.minute) + ' over ' + this.written_number(hour);
    else if (time.minute == 15)
      return 'kwart over ' + this.written_number(hour);
    else if (time.minute < 30)
      return this.written_number(30-time.minute) + ' voor half ' + this.written_number((hour%12)+1);
    else if (time.minute == 30)
      return 'half ' + this.written_number((hour%12)+1);
    else if (time.minute < 45)
      return this.written_number(time.minute-30) + ' over half ' + this.written_number((hour%12)+1);
    else if (time.minute == 45)
      return 'kwart voor ' + this.written_number((hour%12)+1);
    else if (time.minute < 60)
      return this.written_number(60-time.minute) + ' voor ' + this.written_number((hour%12)+1);
  }

  stop_event(e)
  {
    e.stopPropagation();
    e.preventDefault();
  }
}

function start_clock_test(el_n_questions, el_time_delta)
{
  document.body.innerHTML = '';
  let clock_test = new ClockTest({minute_delta: el_time_delta.valueAsNumber, n_questions: el_n_questions.valueAsNumber, speedup: 2});
}

window.onload = function()
{
  let el_n_questions = create_html_element('input', {type: 'number', style: {display: 'inline', font: 'inherit', border: 'none', borderBottom: '1px dashed black', textAlign: 'right', width: '5ex'}});
  el_n_questions.value = "5";
  let el_time_delta = create_html_element('input', {type: 'number', style: {display: 'inline', font: 'inherit', border: 'none', borderBottom: '1px dashed black', textAlign: 'right', width: '5ex'}});
  el_time_delta.value = "5";

  document.body.appendChild(create_html_element('p', {children: ['aantal vragen: ', el_n_questions]}));
  document.body.appendChild(create_html_element('p', {children: ['kleinste insteleenheid: ', el_time_delta, ' minuten']}));
  document.body.appendChild(create_html_element('div', {'class': 'button', text: 'start', events: {click: start_clock_test.bind(undefined, el_n_questions, el_time_delta), touchstart: start_clock_test.bind(undefined, el_n_questions, el_time_delta)}}));

//document.body.appendChild(create_html('p', {text: 'aantal vragen'}
}

// vim: ts=2:sts=2:sw=2:et

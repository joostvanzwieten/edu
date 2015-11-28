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

function clip(x, limits)
{
  if (limits.hasOwnProperty('min') && x < limits.min)
    x = limits.min;
  if (limits.hasOwnProperty('max') && x > limits.max)
    x = limits.max;
  return x;
}

function randrange(settings)
{
  if (settings.start === undefined)
    settings.start = 0;
  if (settings.step === undefined)
    settings.step = 1;
  let n = round_towards_zero((settings.stop+settings.step-1-settings.start)/settings.step);
  return settings.start+clip(round_towards_zero(Math.random()*n), {min: 0, max: n-1})*settings.step;
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

    this._svg_radius = 100;

    this._element = create_svg_element(
      'svg',
      {
        'class': 'clock',
        version: '1.1',
        viewBox: '-{0} -{0} {1} {1}'.format(this._svg_radius, 2*this._svg_radius),
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
        el.addEventListener('touchstart', this.set_adjust_touch.bind(this, s.hand));
        el.addEventListener('mousedown', this.set_adjust_mouse.bind(this, s.hand));
      }
      this.adjust = 'hour';

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
      cumulative_minutes: this._time_in_minutes,
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
    this._previous_touch = this._calc_local_coordinate(e.targetTouches[0]);
    this._adjust_minutes = this._time_in_minutes;
    e.stopPropagation();
    e.preventDefault();
  }

  _clock_touchmove(e)
  {
    let a = this._previous_touch;
    let b = this._calc_local_coordinate(e.targetTouches[0]);
    this._previous_touch = b;
    let d = Math.pow(b.x-a.x,2)+Math.pow(b.y-a.y,2);
    if (d > 0)
    {
      // compute smallest distance to the center along the line from `a` to `b`
      let s = clip(
        -(a.x*(b.x-a.x)+a.y*(b.y-a.y))/d,
        {min: 0, max: 1});
      let r = Math.sqrt(Math.pow(s*b.x+(1-s)*a.x,2)+Math.pow(s*b.y+(1-s)*a.y,2));
      // ignore moves inside a quarter radius, full speed beyond a half radius
      let factor = clip(4*r/this._svg_radius-1, {min: 0, max: 1});
      let angle_delta = -angle_difference(Math.atan2(a.x, -a.y), Math.atan2(b.x, -b.y));
      // update time
      this._adjust_minutes += factor * angle_delta * this._delta[this._adjust_hand] / this._angle_delta[this._adjust_hand];
      this.time = this._time_in_minutes+round_multiple(this._adjust_minutes-this._time_in_minutes, this._delta[this._adjust_hand]);
    }
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
    this._previous_mouse = this._calc_local_coordinate(e);
    this._adjust_minutes = this._time_in_minutes;
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
      let a = this._previous_mouse;
      let b = this._calc_local_coordinate(e);
      this._previous_mouse = b;
      let d = Math.pow(b.x-a.x,2)+Math.pow(b.y-a.y,2);
      if (d > 0)
      {
        // compute smallest distance to the center along the line from `a` to `b`
        let s = clip(
          -(a.x*(b.x-a.x)+a.y*(b.y-a.y))/d,
          {min: 0, max: 1});
        let r = Math.sqrt(Math.pow(s*b.x+(1-s)*a.x,2)+Math.pow(s*b.y+(1-s)*a.y,2));
        // ignore moves inside a quarter radius, full speed beyond a half radius
        let factor = clip(4*r/this._svg_radius-1, {min: 0, max: 1});
        let angle_delta = -angle_difference(Math.atan2(a.x, -a.y), Math.atan2(b.x, -b.y));
        // update time
        this._adjust_minutes += factor * angle_delta * this._delta[this._adjust_hand] / this._angle_delta[this._adjust_hand];
        this.time = this._time_in_minutes+round_multiple(this._adjust_minutes-this._time_in_minutes, this._delta[this._adjust_hand]);
      }
    }
    e.stopPropagation();
    e.preventDefault();
  }

  _stop_event(e)
  {
    e.stopPropagation();
    e.preventDefault();
  }

  get adjust()
  {
    return this._adjust_hand;
  }

  set adjust(hand)
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

  set_adjust_touch(hand, e)
  {
    this.adjust = hand;
  }

  set_adjust_mouse(hand, e)
  {
    this.adjust = hand;
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
    this._button_skip = create_html_element('div', {'class': 'button', text: 'sla over'});
    this._button_check = create_html_element('div', {'class': 'button', text: 'controleer'});
    this._button_skip.addEventListener('click', this.call_if_enabled.bind(this, this._button_skip, [this._button_check], this.skip_question.bind(this)));
    this._button_skip.addEventListener('touchstart', this.call_if_enabled.bind(this, this._button_skip, [this._button_check], this.skip_question.bind(this)));
    this._button_check.addEventListener('click', this.call_if_enabled.bind(this, this._button_check, [this._button_skip], this.test_answer.bind(this)));
    this._button_check.addEventListener('touchstart', this.call_if_enabled.bind(this, this._button_check, [this._button_skip], this.test_answer.bind(this)));
    this._main = create_vertically_centered_html_element(
      'div',
      {
        children: [
          this._question,
          create_html_element('div', {children: [this._clock._element]}),
          create_html_element('div', {children: [this._button_skip, this._button_check]}),
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

  skip_question(e)
  {
    if (e !== undefined)
    {
      e.stopPropagation();
      e.preventDefault();
    }
    let extra = create_html_element(
      'div',
      {
        'class': 'button disabled',
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
    el.outer.classList.add('fadein');
    window.getComputedStyle(el.outer).opacity;
    el.outer.classList.remove('fadein');
    let call = this.call_if_enabled.bind(this, extra, [], this.remove_overlay.bind(this, el.outer, call_next, fadeout));
    extra.addEventListener('click', call);
    extra.addEventListener('touchstart', call);
    window.setTimeout(this.enable_extra.bind(this, extra), 3000);
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
    el.outer.classList.add('fadein');
    window.getComputedStyle(el.outer).opacity;
    el.outer.classList.remove('fadein');
    window.setTimeout(this.remove_overlay.bind(this, el.outer), 2000);
  }

  add_overlay_good()
  {
    let extra = create_html_element(
      'div',
      {
        'class': 'button disabled',
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
    el.outer.classList.add('fadein');
    window.getComputedStyle(el.outer).opacity;
    el.outer.classList.remove('fadein');
    let call = this.call_if_enabled.bind(this, extra, [], this.remove_overlay.bind(this, el.outer, call_next, fadeout));
    extra.addEventListener('click', call);
    extra.addEventListener('touchstart', call);
    window.setTimeout(this.enable_extra.bind(this, extra), 1000);
  }

  add_overlay_stats()
  {
    let extra = create_html_element(
      'div',
      {
        'class': 'button disabled',
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
          create_html_element('p', {text: 'Je hebt {} van de {} vragen goed beantwoord waarvan {} in één keer.'.format(this._n_questions_good, this._n_questions, this._n_questions_good_first_try)}),
          extra
        ],
      },
      {'class': 'overlay'}
    );
    this._element.appendChild(el.outer);
    el.outer.classList.add('fadein');
    window.getComputedStyle(el.outer).opacity;
    el.outer.classList.remove('fadein');
    let call = this.call_if_enabled.bind(this, extra, [], this.remove_overlay.bind(this, el.outer, this.reset.bind(this)));
    extra.addEventListener('click', call);
    extra.addEventListener('touchstart', call);
    window.setTimeout(this.enable_extra.bind(this, extra), 1000);
  }

  call_if_enabled(button, disable_extra, call, e)
  {
    if (!button.classList.contains('disabled'))
    {
      button.classList.add('disabled');
      for (let el of disable_extra)
        el.classList.add('disabled');
      call(e);
    }
    else
    {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  enable_extra(extra)
  {
    extra.classList.remove('disabled');
  }

  remove_overlay(overlay, call_next, fadeout)
  {
    this._button_skip.classList.remove('disabled');
    this._button_check.classList.remove('disabled');
    if (fadeout === undefined)
      fadeout = true;
    if (fadeout)
    {
      overlay.addEventListener('transitionend', this.remove_overlay_part2.bind(this, overlay));
      overlay.classList.add('fadeout');
    }
    else
      window.setTimeout(this.remove_overlay_part2.bind(this, overlay), 200);
    if (call_next !== undefined)
      call_next();
  }

  remove_overlay_part2(overlay)
  {
    try
    {
      this._element.removeChild(overlay);
    }
    catch (e) {}
  }

  reset()
  {
    this._question_number = 0;
    this._n_questions_good = 0;
    this._n_questions_good_first_try = 0;
    this._clock.time = 0;
    this._goal = this._clock.time;
    this.next_question();
  }

  next_question()
  {
    this._clock.time = this._goal;
    this._clock.adjust = 'hour';
    this._question_number += 1;
    this._question_n_tries = 0;
    this._top_bar_text.textContent = 'vraag {} van {}'.format(this._question_number, this._n_questions);
    let goal_minutes = randrange({start: 0, stop: 12*60-this._minute_delta, step: this._minute_delta});
    if (goal_minutes >= this._clock.time.cumulative_minutes)
      goal_minutes += this._minute_delta;
    this._goal = {
      hour: round_towards_zero(goal_minutes/60),
      minute: goal_minutes%60,
    };
    this._question.innerHTML = '';
    this._question.appendChild(create_html_element('p', {text: 'Zet de klok op ' + this.format_time_sentence(this._goal) + '.'}));
    this._button_skip.classList.remove('disabled');
    this._button_check.classList.remove('disabled');
  }

  test_answer(e)
  {
    if (e !== undefined)
    {
      e.stopPropagation();
      e.preventDefault();
    }
    this._question_n_tries += 1;
    if ((this._goal.hour-this._clock.time.hour)%12 == 0 && (this._goal.minute-this._clock.time.minute)%60 == 0)
    {
      this.add_overlay_good();
      this._n_questions_good += 1;
      if (this._question_n_tries == 1)
        this._n_questions_good_first_try += 1;
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

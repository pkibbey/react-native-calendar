'use strict';

import React from 'react-native';
import moment from 'moment';
import _ from 'lodash';

import {
  PropTypes,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

let
  MAX_COLUMNS = 6,
  MAX_ROWS = 7,
  DEVICE_WIDTH = Dimensions.get('window').width,
  VIEW_INDEX = 2;

let Day = React.createClass({

  propTypes: {
    newDay: PropTypes.object,
    isSelected: PropTypes.bool,
    isToday: PropTypes.bool,
    hasEvent: PropTypes.bool,
    currentDay: PropTypes.number,
    onPress: PropTypes.func,
    usingEvents: PropTypes.bool,
    filler: PropTypes.bool,
  },

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.isSelected !== nextProps.isSelected
  },

  _dayCircleStyle(newDay, isSelected, isToday) {
    var dayCircleStyle = [styles.dayCircleFiller];
    if (isSelected && !isToday) {
      dayCircleStyle.push(styles.selectedDayCircle);
    } else if (isSelected && isToday) {
      dayCircleStyle.push(styles.currentDayCircle);
    }
    return dayCircleStyle;
  },

  _dayTextStyle(newDay, isSelected, isToday) {
    var dayTextStyle = [styles.day];
    if (isToday && !isSelected) {
      dayTextStyle.push(styles.currentDayText);
    } else if (isToday || isSelected) {
      dayTextStyle.push(styles.selectedDayText);
    } else if (moment(newDay).day() === 6 || moment(newDay).day() === 0) {
      dayTextStyle.push(styles.weekendDayText);
    }
    return dayTextStyle;
  },

  render() {
    let {
      currentDay,
      newDay,
      isSelected,
      isToday,
      hasEvent,
      usingEvents,
      filler,
    } = this.props;

    if (filler) {
      return (
        <TouchableWithoutFeedback>
          <View style={styles.dayButtonFiller}>
            <Text style={styles.day}></Text>
          </View>
        </TouchableWithoutFeedback>
      );
    } else {
      return (
        <TouchableOpacity onPress={() => this.props.onPress(newDay)}>
          <View style={styles.dayButton}>
            <View style={this._dayCircleStyle(newDay, isSelected, isToday)}>
              <Text style={this._dayTextStyle(newDay, isSelected, isToday)}>{currentDay + 1}</Text>
            </View>
            {usingEvents ?
              <View style={[styles.eventIndicatorFiller, hasEvent && styles.eventIndicator]}></View>
              : null
            }
          </View>
        </TouchableOpacity>
      );
    }
  }
});

let Calendar = React.createClass({
  propTypes: {
    dayHeadings: PropTypes.array,
    onDateSelect: PropTypes.func,
    scrollEnabled: PropTypes.bool,
    showControls: PropTypes.bool,
    prevButtonText: PropTypes.string,
    nextButtonText: PropTypes.string,
    titleFormat: PropTypes.string,
    onSwipeNext: PropTypes.func,
    onSwipePrev: PropTypes.func,
    onTouchNext: PropTypes.func,
    onTouchPrev: PropTypes.func,
    eventDates: PropTypes.array,
    startDate: PropTypes.string,
    selectedDate: PropTypes.string,
    customStyle: PropTypes.object,
  },

  getDefaultProps() {
    return {
      scrollEnabled: false,
      showControls: false,
      prevButtonText: 'Prev',
      nextButtonText: 'Next',
      titleFormat: 'MMMM YYYY',
      dayHeadings: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      startDate: moment().format('YYYY-MM-DD'),
    }
  },

  getInitialState() {
    return {
      calendarDates: this.getInitialStack(),
      selectedDate: moment(this.props.selectedDate).format(),
      currentMonth: moment(this.props.startDate).format()
    };
  },

  componentWillMount() {
    this.renderedMonths = [];
  },

  componentDidMount() {
    this._scrollToItem(VIEW_INDEX);
  },

  getInitialStack() {
    var initialStack = [];
    if (this.props.scrollEnabled) {
      initialStack.push(moment(this.props.startDate).subtract(2, 'month').format());
      initialStack.push(moment(this.props.startDate).subtract(1, 'month').format());
      initialStack.push(moment(this.props.startDate).format());
      initialStack.push(moment(this.props.startDate).add(1, 'month').format());
      initialStack.push(moment(this.props.startDate).add(2, 'month').format());
    } else {
      initialStack.push(moment(this.props.startDate).format())
    }
    return initialStack;
  },

  renderHeading() {
    return (
      <View style={this.styles.calendarHeading}>
        {this.props.dayHeadings.map((day, i) => { return (<Text key={i} style={i == 0 || i == 6 ? this.styles.weekendHeading : this.styles.dayHeading}>{day}</Text>) })}
      </View>
    )
  },

  renderMonthView(date) {
    var dayStart = moment(date).startOf('month').format(),
      daysInMonth = moment(dayStart).daysInMonth(),
      offset = moment(dayStart).get('day'),
      preFiller = 0,
      currentDay = 0,
      weekRows = [],
      renderedMonthView;

    for (var i = 0; i < MAX_COLUMNS; i++) {
      var days = [];
      for (var j = 0; j < MAX_ROWS; j++) {
        if (preFiller < offset) {
          days.push(<Day key={`${i},${j}`} filler={true} />);
        } else {
          if(currentDay < daysInMonth) {
            var newDay = moment(dayStart).set('date', currentDay + 1);
            var isToday = (moment().isSame(newDay, 'month') && moment().isSame(newDay, 'day')) ? true : false;
            var isSelected = (moment(this.state.selectedDate).isSame(newDay, 'month') && moment(this.state.selectedDate).isSame(newDay, 'day')) ? true : false;
            var hasEvent = false;
            if (this.props.eventDates) {
              for (var x = 0; x < this.props.eventDates.length; x++) {
                hasEvent = moment(this.props.eventDates[x]).isSame(newDay, 'day') ? true : false;
                if (hasEvent) { break; }
              }
            }

            days.push((
              <Day
                key={`${i},${j}`}
                onPress={this._selectDate}
                currentDay={currentDay}
                newDay={newDay}
                isToday={isToday}
                isSelected={isSelected}
                hasEvent={hasEvent}
                usingEvents={this.props.eventDates.length > 0 ? true : false}
              />
            ));
            currentDay++;
          }
        }
        preFiller++;
      } // row

      if(days.length > 0 && days.length < 7) {
        for (var x = days.length; x < 7; x++) {
          days.push(<Day key={x} filler={true}/>);
        }
        weekRows.push(<View key={weekRows.length} style={this.styles.weekRow}>{days}</View>);
      } else {
        weekRows.push(<View key={weekRows.length} style={this.styles.weekRow}>{days}</View>);
      }
    } // column

    renderedMonthView = <View key={moment(newDay).month()} style={this.styles.monthContainer}>{weekRows}</View>;
    // keep this rendered month view in case it can be reused without generating it again
    this.renderedMonths.push([date, renderedMonthView])
    return renderedMonthView;
  },

  _dayCircleStyle(newDay, isSelected, isToday) {
    var dayCircleStyle = [this.styles.dayCircleFiller];
    if (isSelected && !isToday) {
      dayCircleStyle.push(this.styles.selectedDayCircle);
    } else if (isSelected && isToday) {
      dayCircleStyle.push(this.styles.currentDayCircle);
    }
    return dayCircleStyle;
  },

  _dayTextStyle(newDay, isSelected, isToday) {
    var dayTextStyle = [this.styles.day];
    if (isToday && !isSelected) {
      dayTextStyle.push(this.styles.currentDayText);
    } else if (isToday || isSelected) {
      dayTextStyle.push(this.styles.selectedDayText);
    } else if (moment(newDay).day() === 6 || moment(newDay).day() === 0) {
      dayTextStyle.push(this.styles.weekendDayText);
    }
    return dayTextStyle;
  },

  _prependMonth() {
    var calendarDates = this.state.calendarDates;
    calendarDates.unshift(moment(calendarDates[0]).subtract(1, 'month').format());
    calendarDates.pop();
    this.setState({
      calendarDates: calendarDates,
      currentMonth: calendarDates[VIEW_INDEX]
    });
  },

  _appendMonth(){
    var calendarDates = this.state.calendarDates;
    calendarDates.push(moment(calendarDates[calendarDates.length - 1]).add(1, 'month').format());
    calendarDates.shift();
    this.setState({
      calendarDates: calendarDates,
      currentMonth: calendarDates[VIEW_INDEX]
    });
  },

  _selectDate(date) {
    this.setState({
      selectedDate: date,
    });
    this.props.onDateSelect && this.props.onDateSelect(date.format());
  },

  _onPrev(){
    this._prependMonth();
    this._scrollToItem(VIEW_INDEX);
    this.props.onTouchPrev && this.props.onTouchPrev(this.state.calendarDates[VIEW_INDEX]);
  },

  _onNext(){
    this._appendMonth();
    this._scrollToItem(VIEW_INDEX);
    this.props.onTouchNext && this.props.onTouchNext(this.state.calendarDates[VIEW_INDEX]);
  },

  _scrollToItem(itemIndex) {
    var scrollToX = itemIndex * DEVICE_WIDTH;
    if (this.props.scrollEnabled) {
      this.refs.calendar.scrollWithoutAnimationTo(0, scrollToX);
    }
  },

  _scrollEnded(event) {
    var position = event.nativeEvent.contentOffset.x;
    var currentPage = position / DEVICE_WIDTH;

    if (currentPage < VIEW_INDEX) {
      this._prependMonth();
      this._scrollToItem(VIEW_INDEX);
      this.props.onSwipePrev && this.props.onSwipePrev();
    } else if (currentPage > VIEW_INDEX) {
      this._appendMonth();
      this._scrollToItem(VIEW_INDEX);
      this.props.onSwipeNext && this.props.onSwipeNext();
    } else {
      return false;
    }
  },

  _renderedMonth(date) {
    var renderedMonth = null;
    if (moment(this.state.currentMonth).isSame(date, 'month')) {
      renderedMonth = this.renderMonthView(date);
    } else {
      for (var i = 0; i < this.renderedMonths.length; i++) {
        if (moment(this.renderedMonths[i][0]).isSame(date, 'month')) {
          renderedMonth = this.renderedMonths[i][1];
        }
      }
      if (!renderedMonth) { renderedMonth = this.renderMonthView(date); }
    }
    return renderedMonth;
  },

  render() {
    this.styles = _.merge(styles, this.props.customStyle);
    return (
      <View style={this.styles.calendarContainer}>
        {this.renderHeading(this.props.titleFormat)}
        {this.props.scrollEnabled ?
          <ScrollView
            ref='calendar'
            horizontal={true}
            scrollEnabled={true}
            pagingEnabled={true}
            removeClippedSubviews={true}
            scrollEventThrottle={600}
            showsHorizontalScrollIndicator={false}
            automaticallyAdjustContentInsets={false}
            onMomentumScrollEnd={(event) => this._scrollEnded(event)}>
              {this.state.calendarDates.map((date) => { return this._renderedMonth(date) })}
          </ScrollView>
          :
          <View ref='calendar'>
            {this.state.calendarDates.map((date) => { return this._renderedMonth(date) })}
          </View>
        }
      </View>
    )
  }
});

var styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: 'white',
  },
  monthContainer: {
    width: DEVICE_WIDTH
  },
  controlButton: {
  },
  controlButtonText: {
    fontSize: 15,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
  },
  calendarHeading: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  dayHeading: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 4,
    color: '#999999'
  },
  weekendHeading: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 4,
    color: '#999999'
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayButton: {
    alignItems: 'center',
    padding: 1,
    width: DEVICE_WIDTH / 7,
  },
  dayButtonFiller: {
    padding: 5,
    width: DEVICE_WIDTH / 7
  },
  day: {
    fontSize: 13,
    textAlign: 'center',
  },
  eventIndicatorFiller: {
    marginTop: 3,
    borderColor: 'transparent',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventIndicator: {
    backgroundColor: '#cccccc'
  },
  dayCircleFiller: {
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: 26,
    height: 26,
    borderRadius: 3,
  },
  currentDayCircle: {
    backgroundColor: 'red',
  },
  currentDayText: {
    color: 'red',
  },
  selectedDayCircle: {
    backgroundColor: '#999999',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
    backgroundColor: 'transparent'
  },
  weekendDayText: {
    color: '#cccccc',
  }
});

module.exports = Calendar;

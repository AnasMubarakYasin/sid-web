// Copyright 2023, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const fs = require('fs');
const _ = require('lodash');
const createNewQueue = ()=>({
        queue: [],
        currentTask: null
    });
const getQueue = ()=>{
    try {
        const buildStatus = JSON.parse(fs.readFileSync('.build-server-queue').toString());
        if (!Array.isArray(buildStatus.queue)) {
            console.error('Queue is not an array, found this instead', JSON.stringify(buildStatus.queue));
            console.error('Returning a blank queue');
            return createNewQueue();
        } else {
            return buildStatus;
        }
    } catch (e) {
        console.error('Queue not retrievable, returning blank queue', e);
        return createNewQueue();
    }
};
const saveQueue = (queue)=>{
    fs.writeFileSync('.build-server-queue', JSON.stringify(queue));
};
const formatTask = (task)=>({
        api: task.api,
        repos: task.repos,
        simName: task.simName,
        version: task.version,
        locales: task.locales,
        servers: task.servers,
        brands: task.brands,
        email: task.email,
        userId: task.userId,
        branch: task.branch,
        enqueueTime: task.enqueueTime
    });
const addTask = (task)=>{
    const buildStatus = getQueue();
    task.enqueueTime = new Date().toString();
    buildStatus.queue.push(formatTask(task));
    saveQueue(buildStatus);
};
const startTask = (task)=>{
    const buildStatus = getQueue();
    const taskIndex = buildStatus.queue.findIndex((t)=>_.isEqual(t, formatTask(task)));
    buildStatus.queue.splice(taskIndex, 1);
    buildStatus.currentTask = task;
    buildStatus.currentTask.startTime = new Date().toString();
    saveQueue(buildStatus);
};
const finishTask = ()=>{
    const buildStatus = getQueue();
    buildStatus.currentTask = null;
    saveQueue(buildStatus);
};
module.exports = {
    addTask: addTask,
    startTask: startTask,
    finishTask: finishTask,
    getQueue: getQueue
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvcGVyc2lzdGVudFF1ZXVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcbi8vIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xuXG5jb25zdCBjcmVhdGVOZXdRdWV1ZSA9ICgpID0+ICggeyBxdWV1ZTogW10sIGN1cnJlbnRUYXNrOiBudWxsIH0gKTtcblxuY29uc3QgZ2V0UXVldWUgPSAoKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgYnVpbGRTdGF0dXMgPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoICcuYnVpbGQtc2VydmVyLXF1ZXVlJyApLnRvU3RyaW5nKCkgKTtcblxuICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGJ1aWxkU3RhdHVzLnF1ZXVlICkgKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCAnUXVldWUgaXMgbm90IGFuIGFycmF5LCBmb3VuZCB0aGlzIGluc3RlYWQnLCBKU09OLnN0cmluZ2lmeSggYnVpbGRTdGF0dXMucXVldWUgKSApO1xuICAgICAgY29uc29sZS5lcnJvciggJ1JldHVybmluZyBhIGJsYW5rIHF1ZXVlJyApO1xuICAgICAgcmV0dXJuIGNyZWF0ZU5ld1F1ZXVlKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1aWxkU3RhdHVzO1xuICAgIH1cbiAgfVxuICBjYXRjaCggZSApIHtcbiAgICBjb25zb2xlLmVycm9yKCAnUXVldWUgbm90IHJldHJpZXZhYmxlLCByZXR1cm5pbmcgYmxhbmsgcXVldWUnLCBlICk7XG4gICAgcmV0dXJuIGNyZWF0ZU5ld1F1ZXVlKCk7XG4gIH1cbn07XG5cbmNvbnN0IHNhdmVRdWV1ZSA9IHF1ZXVlID0+IHtcbiAgZnMud3JpdGVGaWxlU3luYyggJy5idWlsZC1zZXJ2ZXItcXVldWUnLCBKU09OLnN0cmluZ2lmeSggcXVldWUgKSApO1xufTtcblxuY29uc3QgZm9ybWF0VGFzayA9IHRhc2sgPT4gKCB7XG4gIGFwaTogdGFzay5hcGksXG4gIHJlcG9zOiB0YXNrLnJlcG9zLFxuICBzaW1OYW1lOiB0YXNrLnNpbU5hbWUsXG4gIHZlcnNpb246IHRhc2sudmVyc2lvbixcbiAgbG9jYWxlczogdGFzay5sb2NhbGVzLFxuICBzZXJ2ZXJzOiB0YXNrLnNlcnZlcnMsXG4gIGJyYW5kczogdGFzay5icmFuZHMsXG4gIGVtYWlsOiB0YXNrLmVtYWlsLFxuICB1c2VySWQ6IHRhc2sudXNlcklkLFxuICBicmFuY2g6IHRhc2suYnJhbmNoLFxuICBlbnF1ZXVlVGltZTogdGFzay5lbnF1ZXVlVGltZVxufSApO1xuXG5jb25zdCBhZGRUYXNrID0gdGFzayA9PiB7XG4gIGNvbnN0IGJ1aWxkU3RhdHVzID0gZ2V0UXVldWUoKTtcbiAgdGFzay5lbnF1ZXVlVGltZSA9IG5ldyBEYXRlKCkudG9TdHJpbmcoKTtcbiAgYnVpbGRTdGF0dXMucXVldWUucHVzaCggZm9ybWF0VGFzayggdGFzayApICk7XG4gIHNhdmVRdWV1ZSggYnVpbGRTdGF0dXMgKTtcbn07XG5cbmNvbnN0IHN0YXJ0VGFzayA9IHRhc2sgPT4ge1xuICBjb25zdCBidWlsZFN0YXR1cyA9IGdldFF1ZXVlKCk7XG4gIGNvbnN0IHRhc2tJbmRleCA9IGJ1aWxkU3RhdHVzLnF1ZXVlLmZpbmRJbmRleCggdCA9PiBfLmlzRXF1YWwoIHQsIGZvcm1hdFRhc2soIHRhc2sgKSApICk7XG4gIGJ1aWxkU3RhdHVzLnF1ZXVlLnNwbGljZSggdGFza0luZGV4LCAxICk7XG4gIGJ1aWxkU3RhdHVzLmN1cnJlbnRUYXNrID0gdGFzaztcbiAgYnVpbGRTdGF0dXMuY3VycmVudFRhc2suc3RhcnRUaW1lID0gbmV3IERhdGUoKS50b1N0cmluZygpO1xuICBzYXZlUXVldWUoIGJ1aWxkU3RhdHVzICk7XG59O1xuXG5jb25zdCBmaW5pc2hUYXNrID0gKCkgPT4ge1xuICBjb25zdCBidWlsZFN0YXR1cyA9IGdldFF1ZXVlKCk7XG4gIGJ1aWxkU3RhdHVzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgc2F2ZVF1ZXVlKCBidWlsZFN0YXR1cyApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZFRhc2s6IGFkZFRhc2ssXG4gIHN0YXJ0VGFzazogc3RhcnRUYXNrLFxuICBmaW5pc2hUYXNrOiBmaW5pc2hUYXNrLFxuICBnZXRRdWV1ZTogZ2V0UXVldWVcbn07Il0sIm5hbWVzIjpbImZzIiwicmVxdWlyZSIsIl8iLCJjcmVhdGVOZXdRdWV1ZSIsInF1ZXVlIiwiY3VycmVudFRhc2siLCJnZXRRdWV1ZSIsImJ1aWxkU3RhdHVzIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwidG9TdHJpbmciLCJBcnJheSIsImlzQXJyYXkiLCJjb25zb2xlIiwiZXJyb3IiLCJzdHJpbmdpZnkiLCJlIiwic2F2ZVF1ZXVlIiwid3JpdGVGaWxlU3luYyIsImZvcm1hdFRhc2siLCJ0YXNrIiwiYXBpIiwicmVwb3MiLCJzaW1OYW1lIiwidmVyc2lvbiIsImxvY2FsZXMiLCJzZXJ2ZXJzIiwiYnJhbmRzIiwiZW1haWwiLCJ1c2VySWQiLCJicmFuY2giLCJlbnF1ZXVlVGltZSIsImFkZFRhc2siLCJEYXRlIiwicHVzaCIsInN0YXJ0VGFzayIsInRhc2tJbmRleCIsImZpbmRJbmRleCIsInQiLCJpc0VxdWFsIiwic3BsaWNlIiwic3RhcnRUaW1lIiwiZmluaXNoVGFzayIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBLGlEQUFpRDtBQUNqRCx5REFBeUQ7QUFFekQsTUFBTUEsS0FBS0MsUUFBUztBQUNwQixNQUFNQyxJQUFJRCxRQUFTO0FBRW5CLE1BQU1FLGlCQUFpQixJQUFRLENBQUE7UUFBRUMsT0FBTyxFQUFFO1FBQUVDLGFBQWE7SUFBSyxDQUFBO0FBRTlELE1BQU1DLFdBQVc7SUFDZixJQUFJO1FBQ0YsTUFBTUMsY0FBY0MsS0FBS0MsS0FBSyxDQUFFVCxHQUFHVSxZQUFZLENBQUUsdUJBQXdCQyxRQUFRO1FBRWpGLElBQUssQ0FBQ0MsTUFBTUMsT0FBTyxDQUFFTixZQUFZSCxLQUFLLEdBQUs7WUFDekNVLFFBQVFDLEtBQUssQ0FBRSw2Q0FBNkNQLEtBQUtRLFNBQVMsQ0FBRVQsWUFBWUgsS0FBSztZQUM3RlUsUUFBUUMsS0FBSyxDQUFFO1lBQ2YsT0FBT1o7UUFDVCxPQUNLO1lBQ0gsT0FBT0k7UUFDVDtJQUNGLEVBQ0EsT0FBT1UsR0FBSTtRQUNUSCxRQUFRQyxLQUFLLENBQUUsZ0RBQWdERTtRQUMvRCxPQUFPZDtJQUNUO0FBQ0Y7QUFFQSxNQUFNZSxZQUFZZCxDQUFBQTtJQUNoQkosR0FBR21CLGFBQWEsQ0FBRSx1QkFBdUJYLEtBQUtRLFNBQVMsQ0FBRVo7QUFDM0Q7QUFFQSxNQUFNZ0IsYUFBYUMsQ0FBQUEsT0FBVSxDQUFBO1FBQzNCQyxLQUFLRCxLQUFLQyxHQUFHO1FBQ2JDLE9BQU9GLEtBQUtFLEtBQUs7UUFDakJDLFNBQVNILEtBQUtHLE9BQU87UUFDckJDLFNBQVNKLEtBQUtJLE9BQU87UUFDckJDLFNBQVNMLEtBQUtLLE9BQU87UUFDckJDLFNBQVNOLEtBQUtNLE9BQU87UUFDckJDLFFBQVFQLEtBQUtPLE1BQU07UUFDbkJDLE9BQU9SLEtBQUtRLEtBQUs7UUFDakJDLFFBQVFULEtBQUtTLE1BQU07UUFDbkJDLFFBQVFWLEtBQUtVLE1BQU07UUFDbkJDLGFBQWFYLEtBQUtXLFdBQVc7SUFDL0IsQ0FBQTtBQUVBLE1BQU1DLFVBQVVaLENBQUFBO0lBQ2QsTUFBTWQsY0FBY0Q7SUFDcEJlLEtBQUtXLFdBQVcsR0FBRyxJQUFJRSxPQUFPdkIsUUFBUTtJQUN0Q0osWUFBWUgsS0FBSyxDQUFDK0IsSUFBSSxDQUFFZixXQUFZQztJQUNwQ0gsVUFBV1g7QUFDYjtBQUVBLE1BQU02QixZQUFZZixDQUFBQTtJQUNoQixNQUFNZCxjQUFjRDtJQUNwQixNQUFNK0IsWUFBWTlCLFlBQVlILEtBQUssQ0FBQ2tDLFNBQVMsQ0FBRUMsQ0FBQUEsSUFBS3JDLEVBQUVzQyxPQUFPLENBQUVELEdBQUduQixXQUFZQztJQUM5RWQsWUFBWUgsS0FBSyxDQUFDcUMsTUFBTSxDQUFFSixXQUFXO0lBQ3JDOUIsWUFBWUYsV0FBVyxHQUFHZ0I7SUFDMUJkLFlBQVlGLFdBQVcsQ0FBQ3FDLFNBQVMsR0FBRyxJQUFJUixPQUFPdkIsUUFBUTtJQUN2RE8sVUFBV1g7QUFDYjtBQUVBLE1BQU1vQyxhQUFhO0lBQ2pCLE1BQU1wQyxjQUFjRDtJQUNwQkMsWUFBWUYsV0FBVyxHQUFHO0lBQzFCYSxVQUFXWDtBQUNiO0FBRUFxQyxPQUFPQyxPQUFPLEdBQUc7SUFDZlosU0FBU0E7SUFDVEcsV0FBV0E7SUFDWE8sWUFBWUE7SUFDWnJDLFVBQVVBO0FBQ1oifQ==
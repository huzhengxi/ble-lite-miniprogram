// pages/help/help.ts
Page({
  /**
   * 页面的初始数据
   */
  data: {
    valueTypeId: 0,
    valueType: "Hex",
    valueTypeOptions: [
      {
        id: 0,
        name: "Hex",
        value: "hex"
      },
      {
        id: 1,
        name: "UTF-8 String",
        value: "str"
      },
    ],
  },
  dropdownItemChange(event: any) {
    console.log("dropdownItemChange：", event.detail);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() { },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() { },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() { },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() { },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() { },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() { },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() { },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() { },
  btnTap() {
    wx.showModal({
      title: 'chara...',
      placeholderText: '输入 hex ',
      editable: true
    })
  }
});

const {
  ErrorCodes,
  BusinessError,
  bizError,
  getErrorByKey,
  Validators
} = require('../cloudfunctions/common/errors')

describe('错误码模块测试', () => {
  describe('ErrorCodes - 错误码定义', () => {
    test('系统错误码格式正确', () => {
      expect(ErrorCodes.SYSTEM.INTERNAL_ERROR.code).toBe(1000001)
      expect(typeof ErrorCodes.SYSTEM.INTERNAL_ERROR.message).toBe('string')
    })

    test('所有错误码都是7位数字', () => {
      const allCodes = [
        ...Object.values(ErrorCodes.SYSTEM),
        ...Object.values(ErrorCodes.AUTH),
        ...Object.values(ErrorCodes.BOX),
        ...Object.values(ErrorCodes.ORDER),
        ...Object.values(ErrorCodes.DELIVERY),
        ...Object.values(ErrorCodes.USER),
        ...Object.values(ErrorCodes.COMMUNITY),
        ...Object.values(ErrorCodes.COMMON)
      ]

      allCodes.forEach(error => {
        expect(error.code).toBeGreaterThanOrEqual(1000000)
        expect(error.code).toBeLessThanOrEqual(9999999)
      })
    })

    test('模块错误码前缀正确', () => {
      expect(ErrorCodes.BOX.NOT_FOUND.code).toBeGreaterThanOrEqual(3000000)
      expect(ErrorCodes.BOX.NOT_FOUND.code).toBeLessThanOrEqual(3999999)
      expect(ErrorCodes.ORDER.NOT_FOUND.code).toBeGreaterThanOrEqual(4000000)
      expect(ErrorCodes.ORDER.NOT_FOUND.code).toBeLessThanOrEqual(4999999)
      expect(ErrorCodes.DELIVERY.NOT_FOUND.code).toBeGreaterThanOrEqual(5000000)
      expect(ErrorCodes.DELIVERY.NOT_FOUND.code).toBeLessThanOrEqual(5999999)
      expect(ErrorCodes.USER.NOT_FOUND.code).toBeGreaterThanOrEqual(6000000)
      expect(ErrorCodes.USER.NOT_FOUND.code).toBeLessThanOrEqual(6999999)
    })
  })

  describe('BusinessError - 业务异常类', () => {
    test('应正确创建业务异常', () => {
      const error = new BusinessError(ErrorCodes.BOX.NOT_FOUND)

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe(3000001)
      expect(error.message).toBe('盲盒不存在')
      expect(error.name).toBe('BusinessError')
    })

    test('应包含详细信息', () => {
      const details = [{ field: 'title', message: '标题不能为空' }]
      const error = new BusinessError(ErrorCodes.SYSTEM.PARAM_INVALID, details)

      expect(error.details).toEqual(details)
    })

    test('toJSON应返回正确格式', () => {
      const error = new BusinessError(ErrorCodes.BOX.NOT_FOUND)
      const json = error.toJSON()

      expect(json).toEqual({
        success: false,
        error: {
          code: 3000001,
          message: '盲盒不存在',
          details: null
        }
      })
    })
  })

  describe('bizError - 创建业务异常', () => {
    test('应正确解析错误键', () => {
      const error = bizError('BOX.NOT_FOUND')

      expect(error.code).toBe(3000001)
      expect(error.message).toBe('盲盒不存在')
    })

    test('无效的错误键应返回默认错误', () => {
      const error = bizError('INVALID.KEY')

      expect(error.code).toBe(1000004)
      expect(error.message).toBe('参数无效')
    })

    test('应传递详细信息', () => {
      const details = [{ field: 'price', message: '价格必须大于0' }]
      const error = bizError('BOX.PRICE_INVALID', details)

      expect(error.details).toEqual(details)
    })
  })

  describe('getErrorByKey - 获取错误信息', () => {
    test('应正确获取错误信息', () => {
      const error = getErrorByKey('ORDER.NOT_FOUND')

      expect(error.code).toBe(4000001)
      expect(error.message).toBe('订单不存在')
    })

    test('大小写不敏感', () => {
      const error1 = getErrorByKey('box.not_found')
      const error2 = getErrorByKey('BOX.NOT_FOUND')

      expect(error1).toEqual(error2)
    })
  })

  describe('Validators - 校验函数', () => {
    describe('isNonEmptyString', () => {
      test('空字符串应抛出异常', () => {
        expect(() => Validators.isNonEmptyString('', 'field'))
          .toThrow()
      })

      test('null应抛出异常', () => {
        expect(() => Validators.isNonEmptyString(null, 'field'))
          .toThrow()
      })

      test('有效字符串应通过', () => {
        expect(() => Validators.isNonEmptyString('hello', 'field'))
          .not.toThrow()
      })

      test('仅空格字符串应抛出异常', () => {
        expect(() => Validators.isNonEmptyString('   ', 'field'))
          .toThrow()
      })
    })

    describe('isPositiveNumber', () => {
      test('负数应抛出异常', () => {
        expect(() => Validators.isPositiveNumber(-1, 'field'))
          .toThrow()
      })

      test('0应通过', () => {
        expect(() => Validators.isPositiveNumber(0, 'field'))
          .not.toThrow()
      })

      test('正数应通过', () => {
        expect(() => Validators.isPositiveNumber(10, 'field'))
          .not.toThrow()
      })

      test('NaN应抛出异常', () => {
        expect(() => Validators.isPositiveNumber('abc', 'field'))
          .toThrow()
      })
    })

    describe('isInRange', () => {
      test('小于最小值应抛出异常', () => {
        expect(() => Validators.isInRange(0, 'field', 1, 10))
          .toThrow()
      })

      test('大于最大值应抛出异常', () => {
        expect(() => Validators.isInRange(15, 'field', 1, 10))
          .toThrow()
      })

      test('在范围内应通过', () => {
        expect(() => Validators.isInRange(5, 'field', 1, 10))
          .not.toThrow()
      })
    })

    describe('isOpenid', () => {
      test('无效openid应抛出异常', () => {
        expect(() => Validators.isOpenid('abc', 'field'))
          .toThrow()
      })

      test('有效openid应通过', () => {
        expect(() => Validators.isOpenid('oABCD1234567890abcdef', 'field'))
          .not.toThrow()
      })
    })

    describe('maxLength', () => {
      test('超长字符串应抛出异常', () => {
        expect(() => Validators.maxLength('abcdef', 'field', 3))
          .toThrow()
      })

      test('在限制内应通过', () => {
        expect(() => Validators.maxLength('abc', 'field', 5))
          .not.toThrow()
      })
    })
  })
})
